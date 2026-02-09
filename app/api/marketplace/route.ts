import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Define types outside the handler to satisfy linters
interface Location {
  state: string;
  city: string;
  price: number;
}

export async function GET(req: Request) {
  const client = await pool.connect();

  try {
    const { searchParams } = new URL(req.url);

    // 1. Extract Query Params
    const queryTerm = searchParams.get('q') || '';
    const category = searchParams.get('category') || ''; 
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';
    const technologyFilter = searchParams.get('technology') || '';
    const locationFilter = searchParams.get('location') || ''; 
    const minQty = searchParams.get('minQty'); 

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // 2. Build Dynamic SQL
    const values: (string | number)[] = [];
    const conditions: string[] = [];
    let paramIndex = 1;

    // --- Search (Name or Supplier Name) ---
    if (queryTerm) {
      values.push(`%${queryTerm}%`);
      conditions.push(`(p.name ILIKE $${paramIndex} OR s.company_name ILIKE $${paramIndex})`);
      paramIndex++;
    }

    // --- Category Filter ---
    if (category && category !== 'All') {
      values.push(category);
      conditions.push(`p.category = $${paramIndex}`);
      paramIndex++;
    }

    // --- Technology Filter ---
    if (technologyFilter && technologyFilter !== 'All') {
      values.push(`%${technologyFilter}%`);
      conditions.push(`p.technology ILIKE $${paramIndex}`);
      paramIndex++;
    }

    // --- MOQ Filter (Extract numeric value from string column) ---
    if (minQty && minQty !== '0') {
        conditions.push(`(NULLIF(regexp_replace(p.min_order, '[^0-9.]', '', 'g'), '')::numeric) <= ${Number(minQty)}`);
    }

    // --- Location Filter (Search in product_pricing table) ---
    if (locationFilter && locationFilter !== 'All') {
       values.push(`%${locationFilter}%`);
       conditions.push(`EXISTS (
          SELECT 1 FROM product_pricing pp 
          WHERE pp.product_id = p.id 
          AND (pp.city ILIKE $${paramIndex} OR pp.state ILIKE $${paramIndex})
       )`);
       paramIndex++;
    }

    // --- Price Filter (Search in product_pricing OR base price) ---
    if (minPrice || maxPrice) {
       // Check if base price matches OR if any location price matches
       const priceCondition = `(
         (p.price_ex_factory IS NOT NULL 
          ${minPrice ? `AND p.price_ex_factory >= ${Number(minPrice)}` : ''} 
          ${maxPrice ? `AND p.price_ex_factory <= ${Number(maxPrice)}` : ''}
         )
         OR EXISTS (
           SELECT 1 FROM product_pricing pp WHERE pp.product_id = p.id
           ${minPrice ? `AND pp.price >= ${Number(minPrice)}` : ''}
           ${maxPrice ? `AND pp.price <= ${Number(maxPrice)}` : ''}
         )
       )`;
       conditions.push(priceCondition);
    }

    // Combine WHERE clauses
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // --- Sorting Logic ---
    let orderBy = 'ORDER BY p.id DESC';
    switch (sort) {
      case 'price_asc':
        orderBy = `ORDER BY COALESCE((SELECT MIN(price) FROM product_pricing WHERE product_id = p.id), p.price_ex_factory) ASC NULLS LAST`;
        break;
      case 'price_desc':
        orderBy = `ORDER BY COALESCE((SELECT MAX(price) FROM product_pricing WHERE product_id = p.id), p.price_ex_factory) DESC NULLS LAST`;
        break;
      case 'newest':
        orderBy = `ORDER BY p.created_at DESC`;
        break;
    }

    // 3. Final Query
    const sqlQuery = `
      SELECT 
        p.id, 
        p.name, 
        s.company_name as supplier_name,
        p.supplier_id,
        p.category,
        p.technology,
        p.type, 
        p.power_kw,
        p.min_order,
        p.qty_mw,
        p.availability_days,
        p.validity,  -- Added Validity here
        p.datasheet,
        p.panfile, 
        p.ondfile,
        p.price_ex_factory, 
        p.attributes,
        
        -- Aggregate Locations
        COALESCE(
          json_agg(
            json_build_object('state', pp.state, 'city', pp.city, 'price', pp.price)
          ) FILTER (WHERE pp.id IS NOT NULL), 
          '[]'
        ) as locations,

        COUNT(*) OVER() as full_count
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN product_pricing pp ON p.id = pp.product_id
      ${whereClause}
      GROUP BY p.id, s.company_name
      ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Add limit and offset to values array
    values.push(limit, offset);

    // 4. Execute
    const result = await client.query(sqlQuery, values);

    // 5. Transform Data for Frontend
    const products = result.rows.map((row) => {
      const attributes = row.attributes || {};
      
      // Determine display price (Use base price, or lowest location price if available)
      let displayPrice = Number(row.price_ex_factory) || 0;
      
      // If we have location prices, find the lowest one to show "From ₹X"
      if (Array.isArray(row.locations) && row.locations.length > 0) {
          const locPrices = row.locations.map((l: Location) => Number(l.price));
          const minLoc = Math.min(...locPrices);
          if (displayPrice === 0 || minLoc < displayPrice) {
              displayPrice = minLoc;
          }
      }

      return {
        id: row.id,
        name: row.name,
        supplier: row.supplier_name || 'Unknown Supplier',
        supplierId: row.supplier_id,
        category: row.category,
        
        // Mapped Fields
        technology: row.technology, 
        type: row.type,
        power: Number(row.power_kw) || 0,
        moq: row.min_order,
        availability: row.availability_days,
        validity: row.validity, // Now correctly passed
        priceEx: displayPrice,
        
        datasheet: row.datasheet,
        panfile: row.panfile,
        ondfile: row.ondfile,

        locations: row.locations, 
        ...attributes, 
      };
    });

    const totalItems = result.rows.length > 0 ? Number(result.rows[0].full_count) : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: { page, limit, totalItems, totalPages },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Marketplace API Error]', errorMessage);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  } finally {
    client.release();
  }
}