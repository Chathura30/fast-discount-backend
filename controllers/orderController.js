const db = require("../models/db");


// CREATE NEW ORDER

exports.createOrder = (req, res) => {
  const {
    customer_id,
    customer_name,
    customer_number,
    customer_address,
    total_amount,
    payment_method,
    items,
  } = req.body;

  if (
    !customer_id ||
    !customer_name ||
    !customer_number ||
    !customer_address ||
    !total_amount ||
    !payment_method ||
    !items
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  const insertOrderQuery = `
    INSERT INTO orders 
    (customer_id, customer_name, customer_number, customer_address, total_amount, payment_method, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())
  `;

  db.query(
    insertOrderQuery,
    [
      customer_id,
      customer_name,
      customer_number,
      customer_address,
      total_amount,
      payment_method,
    ],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: err.message });

      const orderId = result.insertId;

      if (!items.length) {
        return res.status(400).json({
          success: false,
          message: "Order must have at least one item",
        });
      }

      const insertItemsQuery = `
        INSERT INTO order_items 
        (order_id, product_id, product_name, quantity, price, image) 
        VALUES ?
      `;

      const itemsValues = items.map((item) => [
        orderId,
        item.product_id,
        item.name,
        item.quantity,
        item.price,
        item.image,
      ]);

      db.query(insertItemsQuery, [itemsValues], (err2) => {
        if (err2)
          return res
            .status(500)
            .json({ success: false, message: err2.message });

        const fullOrderQuery = `
          SELECT o.*, 
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'price', oi.price,
                'image', oi.image
              )
            ) AS items
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.id = ?
          GROUP BY o.id
        `;

        db.query(fullOrderQuery, [orderId], (err3, order) => {
          if (err3)
            return res
              .status(500)
              .json({ success: false, message: err3.message });

          res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: order[0],
          });
        });
      });
    }
  );
};


// COMMON ORDER QUERY

const ORDER_JOIN_QUERY = `
  SELECT 
    o.*,
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'price', oi.price,
          'image', oi.image
        )
      )
      FROM order_items oi
      WHERE oi.order_id = o.id
    ) AS items
  FROM orders o
`;


// GET ALL ORDERS (ADMIN)

exports.getAllOrders = (req, res) => {
  const query = `${ORDER_JOIN_QUERY} ORDER BY o.created_at DESC`;

  db.query(query, (err, orders) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });

    res.json({ success: true, orders });
  });
};


// GET USER ORDERS

exports.getUserOrders = (req, res) => {
  const { customer_id } = req.params;

  const query = `
    ${ORDER_JOIN_QUERY}
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC
  `;

  db.query(query, [customer_id], (err, orders) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });

    res.json({ success: true, orders });
  });
};


// GET ORDER DETAILS

exports.getOrderDetails = (req, res) => {
  const { orderId } = req.params;

  const query = `
    SELECT o.*,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'image', oi.image
          )
        )
        FROM order_items oi
        WHERE oi.order_id = o.id
      ) AS items
    FROM orders o
    WHERE o.id = ?
    GROUP BY o.id
  `;

  db.query(query, [orderId], (err, results) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });

    if (!results.length)
      return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order: results[0] });
  });
};


// ADMIN CONFIRM ORDER

exports.confirmOrder = (req, res) => {
  const { orderId } = req.params;

  const query = `
    UPDATE orders 
    SET status = 'Confirmed' 
    WHERE id = ?
  `;

  db.query(query, [orderId], (err) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });

    res.json({ success: true, message: "Order confirmed" });
  });
};


// TODAY ORDERS (PENDING)

exports.getTodayOrders = (req, res) => {
  const query = `
    ${ORDER_JOIN_QUERY}
    WHERE DATE(o.created_at) = CURDATE()
      AND o.status = 'Pending'
    ORDER BY o.created_at DESC
  `;

  db.query(query, (err, orders) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });

    res.json({ success: true, orders });
  });
};


// CONFIRMED ORDERS

exports.getConfirmedOrders = (req, res) => {
  const query = `
    ${ORDER_JOIN_QUERY}
    WHERE o.status = 'Confirmed'
    ORDER BY o.created_at DESC
  `;

  db.query(query, (err, orders) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });

    res.json({ success: true, orders });
  });
};


// SALES REPORT (ADMIN) - CALLBACK VERSION

exports.getSalesReport = (req, res) => {
  // 1. Get all confirmed orders
const ordersQuery = `SELECT * FROM orders WHERE status='Confirmed'`;

db.query(ordersQuery, (err, orders) => {
  if (err) {
    console.log("Sales Report Error:", err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!orders.length) {
    return res.json({
      summary: { total_sales: 0, total_orders: 0, total_items: 0 },
      daily_sales: [],
      monthly_sales: [],
      best_selling_products: [],
    });
  }

  // Safely calculate total sales
  const totalSales = orders.reduce((sum, o) => {
    const amount = parseFloat(o.total_amount) || 0; 
    return sum + amount;
  }, 0);


const totalOrders = orders.length;

    // 2. Total items sold per product
    const itemsQuery = `
      SELECT product_name, SUM(quantity) AS total_sold
      FROM order_items
      GROUP BY product_name
      ORDER BY total_sold DESC
    `;

    db.query(itemsQuery, (err2, items) => {
      if (err2) {
        console.log("Sales Report Error:", err2);
        return res.status(500).json({ message: "Server error" });
      }

      const totalItems = items.reduce((sum, i) => sum + i.total_sold, 0);

      // 3. Daily sales
      const dailyQuery = `
        SELECT DATE(created_at) AS date, SUM(total_amount) AS daily_sales
        FROM orders
        WHERE status='Confirmed'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      db.query(dailyQuery, (err3, dailySales) => {
        if (err3) {
          console.log("Sales Report Error:", err3);
          return res.status(500).json({ message: "Server error" });
        }

        // 4. Monthly sales
        const monthlyQuery = `
          SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(total_amount) AS monthly_sales
          FROM orders
          WHERE status='Confirmed'
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month ASC
        `;

        db.query(monthlyQuery, (err4, monthlySales) => {
          if (err4) {
            console.log("Sales Report Error:", err4);
            return res.status(500).json({ message: "Server error" });
          }

          // Final response
          res.json({
            summary: { total_sales: totalSales, total_orders: totalOrders, total_items: totalItems },
            daily_sales: dailySales,
            monthly_sales: monthlySales,
            best_selling_products: items,
          });
        });
      });
    });
  });
};
