import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req: Request) {
  const client = await pool.connect();
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // 1. FETCH PRODUCT DATA
    // Updated: ORDER BY p.row_order ASC so the drag-and-drop order persists
    const productQuery = `
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
      ORDER BY p.row_order ASC, p.id DESC
    `;
    
    const productResult = await client.query(productQuery, [supplierId]);

    // 2. FETCH SUPPLIER PROFILE
    const profileQuery = `
      SELECT 
        company_name as "companyName",
        email,
        phone,
        website,
        location,
        about_us as "aboutUs",
        gallery
      FROM suppliers 
      WHERE id = $1
    `;
    const profileResult = await client.query(profileQuery, [supplierId]);
    const profile = profileResult.rows[0] || {};

    // Return combined data
    return NextResponse.json({ 
      products: productResult.rows, 
      profile: profile
    });

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
      const placeholders = locs.map((loc, i) => {
        const offset = i * 4;
        values.push(productId, loc.state, loc.city, loc.price);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      }).join(',');

      const query = `INSERT INTO product_pricing (product_id, state, city, price) VALUES ${placeholders}`;
      await client.query(query, values);
    };

    // --- ACTION: REORDER PRODUCTS (New) ---
    // Updates the row_order column for a list of products
    if (action === 'reorder_products') {
      const { items } = data; // Expects array of { id, row_order }
      
      try {
        await client.query('BEGIN');
        for (const item of items) {
          await client.query(
            'UPDATE products SET row_order = $1 WHERE id = $2', 
            [item.row_order, item.id]
          );
        }
        await client.query('COMMIT');
        return NextResponse.json({ success: true });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    // --- ACTION: UPDATE PROFILE ---
    if (action === 'update_profile') {
      const { supplierId, companyName, phone, website, location, aboutUs, gallery } = data;

      const updateQuery = `
        UPDATE suppliers 
        SET 
          company_name = $1,
          phone = $2,
          website = $3,
          location = $4,
          about_us = $5,
          gallery = $6
        WHERE id = $7
      `;
      
      await client.query(updateQuery, [companyName, phone, website, location, aboutUs, gallery, supplierId]);
      return NextResponse.json({ success: true });
    }

    // --- ACTION: CREATE PRODUCT ---
    if (action === 'create_product') {
      const { 
        name, supplierId, category, technology, type,
        power_kw, min_order, qty_mw, availability_days, stock_location, // Added new fields
        datasheet, panfile, ondfile, validity, price_ex_factory,
        locations, 
        ...restAttributes 
      } = data;

      try {
        await client.query('BEGIN');

        // 1. Calculate the next row_order (put at the end of the list)
        const orderRes = await client.query(
          'SELECT COALESCE(MAX(row_order), 0) + 1 as next_order FROM products WHERE supplier_id = $1', 
          [supplierId]
        );
        const nextOrder = orderRes.rows[0].next_order;

        // 2. Insert Product
        const insertProduct = `
          INSERT INTO products (
            supplier_id, name, category, technology, type,
            power_kw, min_order, qty_mw, availability_days, stock_location,
            datasheet, panfile, ondfile, validity, price_ex_factory,
            attributes, row_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
          RETURNING id
        `;
        
        const res = await client.query(insertProduct, [
          supplierId, name, category || 'module', technology, type,
          power_kw, min_order, qty_mw, availability_days, stock_location,
          datasheet, panfile, ondfile, validity, price_ex_factory,
          JSON.stringify(restAttributes), nextOrder
        ]);
        
        const newId = res.rows[0].id;

        // 3. Save Locations
        await insertLocations(newId, locations);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, newId });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    // --- ACTION: UPDATE PRODUCT ---
    if (action === 'update_product') {
      const { 
        id, name, category, technology, type,
        power_kw, min_order, qty_mw, availability_days, stock_location, // Added new fields
        datasheet, panfile, ondfile, validity, price_ex_factory,
        locations,
        ...restAttributes 
      } = data;

      try {
        await client.query('BEGIN');

        const updateProduct = `
          UPDATE products SET 
            name=$1, category=$2, technology=$3, type=$4,
            power_kw=$5, min_order=$6, qty_mw=$7, availability_days=$8, stock_location=$9,
            datasheet=$10, panfile=$11, ondfile=$12, validity=$13, price_ex_factory=$14,
            attributes=$15
          WHERE id=$16
        `;

        await client.query(updateProduct, [
          name, category, technology, type,
          power_kw, min_order, qty_mw, availability_days, stock_location,
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

    // --- ACTION: DELETE PRODUCT ---
    if (action === 'delete_product') {
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