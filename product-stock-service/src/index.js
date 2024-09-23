const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3001;
const ACTIONS = 'http://localhost:3002'

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


// PostgreSQL connection pool for the specific database
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});



// Function to create the database if it doesn't exist
async function createDatabaseIfNotExists() {
  const dbName = process.env.DB_NAME;
  try {
    await pool.query(`CREATE DATABASE "${dbName}";`);
    console.log(`Database ${dbName} created successfully.`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`Database ${dbName} already exists.`);
    } else {
      console.error('Error creating database:', error);
    }
  }
}



// Create necessary tables
async function createTables() {
  const productTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      plu VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL
    );
  `;

  const stockTableQuery = `
    CREATE TABLE IF NOT EXISTS stocks (
      id SERIAL PRIMARY KEY,
      product_id INT REFERENCES products(id),
      stock_on_shelf INT NOT NULL,
      stock_in_order INT NOT NULL,
      shop_id INT NOT NULL
    );
  `;

  try {
    await pool.query(productTableQuery);
    await pool.query(stockTableQuery);
    console.log('Tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}



// Create a product
app.post('/products', async (req, res) => {
  const { plu, name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (plu, name) VALUES ($1, $2) RETURNING *',
      [plu, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});



app.get('/populate-products', async (req, res) => {
  const products = [];

  // Generate 100 random products using Faker.js
  for (let i = 0; i < 100; i++) {
    let letters = faker.string.alpha({ length: 2, casing: 'lower' }); // 'eu'
    let numeric = faker.string.numeric({ length: 4, exclude: ['0'] }) // '9428'
    const product = {
      plu: letters + numeric,
      name: faker.commerce.productName() // 'Incredible Soft Gloves'
    };
    products.push(product);
  }

  // Insert generated products into the database
  try {
    const insertPromises = products.map(product =>
      pool.query(
        'INSERT INTO products (plu, name) VALUES ($1, $2) RETURNING *',
        [product.plu, product.name]
      )
    );
    const results = await Promise.all(insertPromises);

    res.status(201).json({ message: '100 random products added', products: results.map(result => result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Create a stock
app.post('/stocks', async (req, res) => {
  const { product_id, stock_on_shelf, stock_in_order, shop_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO stocks (product_id, stock_on_shelf, stock_in_order, shop_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [product_id, stock_on_shelf, stock_in_order, shop_id]
    );

    // Log the action to the action-log-service
    await axios.post(ACTIONS + '/log', {
      shop_id,
      plu,
      action: `Stock created`,
    }).then((res) => {
      console.log(res);
    }).catch((e) => { console.log(e) });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating stock:', error);
    res.status(500).json({ error: 'Failed to create stock' });
  }
});



// Increase stock
app.put('/stocks/increase', async (req, res) => {
  const { stock_id, amount } = req.body;
  try {
    const result = await pool.query(
      'UPDATE stocks SET stock_on_shelf = stock_on_shelf + $1 WHERE id = $2 RETURNING *',
      [amount, stock_id]
    );
    const updatedStock = result.rows[0];

    // Fetch product details for logging
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [updatedStock.product_id]);

    // Log the action to the action-log-service
    await axios.post(ACTIONS + '/log', {
      shop_id: updatedStock.shop_id,
      plu: product.rows[0].plu,
      action: `Stock increased by ${amount}, new stock: ${updatedStock.stock_on_shelf}`,
    }).then((res) => {
      console.log(res);
    }).catch((e) => { console.log(e) });

    res.status(200).json(updatedStock);
  } catch (error) {
    console.error('Error increasing stock:', error);
    res.status(500).json({ error: 'Failed to increase stock' });
  }
});



// Decrease stock
app.put('/stocks/decrease', async (req, res) => {

  const { stock_id, amount } = req.body;
  try {
    const result = await pool.query(
      'UPDATE stocks SET stock_on_shelf = stock_on_shelf - $1 WHERE id = $2 RETURNING *',
      [amount, stock_id]
    );

    // Log the action to the action-log-service
    await axios.post(ACTIONS + '/log', {
      shop_id: updatedStock.shop_id,
      plu: product.rows[0].plu,
      action: `Stock decreased by ${amount}, new stock: ${updatedStock.stock_on_shelf}`,
    }).then((res) => {
      console.log(res);
    }).catch((e) => { console.log(e) });

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error decreasing stock:', error);
    res.status(500).json({ error: 'Failed to decrease stock' });
  }
});



// Get stocks with filters
app.get('/stocks', async (req, res) => {

  const { plu, shop_id, stock_on_shelf_min, stock_on_shelf_max, stock_in_order_min, stock_in_order_max } = req.query;
  try {
    let query = 'SELECT * FROM stocks WHERE 1=1';
    const params = [];

    if (plu) {
      query += ' AND product_id IN (SELECT id FROM products WHERE plu = $' + (params.length + 1) + ')';
      params.push(plu);
    }
    if (shop_id) {
      query += ' AND shop_id = $' + (params.length + 1);
      params.push(shop_id);
    }
    if (stock_on_shelf_min) {
      query += ' AND stock_on_shelf >= $' + (params.length + 1);
      params.push(stock_on_shelf_min);
    }
    if (stock_on_shelf_max) {
      query += ' AND stock_on_shelf <= $' + (params.length + 1);
      params.push(stock_on_shelf_max);
    }
    if (stock_in_order_min) {
      query += ' AND stock_in_order >= $' + (params.length + 1);
      params.push(stock_in_order_min);
    }
    if (stock_in_order_max) {
      query += ' AND stock_in_order <= $' + (params.length + 1);
      params.push(stock_in_order_max);
    }

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});




// Get products with filters
app.get('/products', async (req, res) => {
  const { name, plu } = req.query;
  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND name ILIKE $' + (params.length + 1);
      params.push('%' + name + '%');
    }
    if (plu) {
      query += ' AND plu = $' + (params.length + 1);
      params.push(plu);
    }

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});



app.listen(port, async () => {
  console.log(`Product Stock Service running on port ${port}`);
  await createDatabaseIfNotExists(); // Check and create database
  await createTables(); // Create tables when the service starts
});


