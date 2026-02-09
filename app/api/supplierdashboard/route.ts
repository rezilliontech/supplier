import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req: Request) {
  const client = await pool.connect();
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // JOIN product + product_pricing
    // We group pricing rows into a JSON array called 'locations'
    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object('state', pp.state, 'city', pp.city, 'price', pp.price)
          ) FILTER (WHERE pp.id IS NOT NULL), 
          '[]'
        ) as locations
      FROM products p
      LEFT JOIN product_pricing pp ON p.id = pp.product_id
      WHERE p.supplier_id = $1
      GROUP BY p.id
      ORDER BY p.id DESC
    `;
    
    const result = await client.query(query, [supplierId]);
    
    // Fetch custom UI settings if needed
    const settingsRes = await client.query(`SELECT setting_value FROM dashboard_settings WHERE setting_key = 'rows'`);
    const rows = settingsRes.rows[0]?.setting_value || [];

    return NextResponse.json({ products: result.rows, rows });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { action, data } = body;

    // --- HELPER: Insert Locations ---
    interface Location {
      state: string;
      city: string;
      price: number;
    }

    const insertLocations = async (productId: number, locs: Location[]) => {
      if (!locs || locs.length === 0) return;
      
      const values: (number | string)[] = [];
      const placeholders = locs.map((_, i) => {
        const base = i * 4;
        values.push(productId, _.state, _.city, _.price);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      }).join(',');

      await client.query(
        `INSERT INTO product_pricing (product_id, state, city, price) VALUES ${placeholders}`,
        values
      );
    };

    // --- CREATE PRODUCT ---
    if (action === 'create_product') {
      const { 
        name, supplierId, category, technology, type,
        power_kw, min_order, qty_mw, availability, 
        datasheet, panfile, ondfile, validity, price_ex_factory,
        locations, // Array from frontend
        ...restAttributes 
      } = data;

      try {
        await client.query('BEGIN');

        const insertProduct = `
          INSERT INTO products (
            supplier_id, name, category, technology, type,
            power_kw, min_order, qty_mw, availability_days, 
            datasheet, panfile, ondfile, validity, price_ex_factory,
            attributes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
          RETURNING id
        `;
        
        const res = await client.query(insertProduct, [
          supplierId, name, category || 'module', technology, type,
          power_kw, min_order, qty_mw, availability,
          datasheet, panfile, ondfile, validity, price_ex_factory,
          JSON.stringify(restAttributes)
        ]);
        
        const newId = res.rows[0].id;

        // Save Locations to second table
        await insertLocations(newId, locations);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, newId });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    // --- UPDATE PRODUCT ---
    if (action === 'update_product') {
      const { 
        id, name, category, technology, type,
        power_kw, min_order, qty_mw, availability, 
        datasheet, panfile, ondfile, validity, price_ex_factory,
        locations,
        ...restAttributes 
      } = data;

      try {
        await client.query('BEGIN');

        const updateProduct = `
          UPDATE products SET 
            name=$1, category=$2, technology=$3, type=$4,
            power_kw=$5, min_order=$6, qty_mw=$7, availability_days=$8,
            datasheet=$9, panfile=$10, ondfile=$11, validity=$12, price_ex_factory=$13,
            attributes=$14
          WHERE id=$15
        `;

        await client.query(updateProduct, [
          name, category, technology, type,
          power_kw, min_order, qty_mw, availability,
          datasheet, panfile, ondfile, validity, price_ex_factory,
          JSON.stringify(restAttributes), id
        ]);

        // Wipe old locations and re-insert new ones
        await client.query(`DELETE FROM product_pricing WHERE product_id = $1`, [id]);
        await insertLocations(id, locations);

        await client.query('COMMIT');
        return NextResponse.json({ success: true });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    // --- DELETE PRODUCT ---
    if (action === 'delete_product') {
      // Cascade delete will handle the pricing table automatically
      await client.query(`DELETE FROM products WHERE id = $1`, [data.id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}