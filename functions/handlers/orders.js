const { db } = require("../util/admin");

exports.getAllOrders = (req, res) => {
  db.collection("orders")
    .orderBy("requestedTime", "desc")
    .get()
    .then((data) => {
      let currentDate = Math.floor(new Date() / 1000);

      let order = [];
      data.forEach((doc) => {
        if (
          new Date(doc.data().createdAt._seconds * 1000).getDate() ===
            new Date(currentDate * 1000).getDate() &&
          new Date(doc.data().createdAt._seconds * 1000).getMonth() ===
            new Date(currentDate * 1000).getMonth() &&
          new Date(doc.data().createdAt._seconds * 1000).getFullYear() ===
            new Date(currentDate * 1000).getFullYear()
        ) {
          console.log("SUCCESS");
          order.push({ ...doc.data(), id: doc.id });
        }
      });
      return res.json(order);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err.code,
      });
    });
};

exports.postOrder = (req, res) => {
  if (req.body.orderName.trim() === "") {
    return res.status(400).json({ orderName: "Order must not be empty." });
  }

  const newOrder = {
    orderName: req.body.orderName,
    username: req.user.username,
    createdAt: new Date(),
    requestedTime: req.body.requestedTime,
  };

  db.collection("orders")
    .add(newOrder)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.log(err);
    });
};

exports.getOrder = (req, res) => {
  let orderData = {};
  db.doc(`/orders/${req.params.orderId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Order not found" });
      }

      orderData = doc.data();
      orderData.orderId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("orderId", "==", req.params.orderId)
        .get();
    })
    .then((data) => {
      orderData.comments = [];
      data.forEach((doc) => {
        orderData.comments.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ orderData });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ errоr: err.code });
    });
};

exports.commentOnOrder = (req, res) => {
  if (req.body.comment.trim() === "") {
    return res.status(400).json({ Comment: "Comment must not be empty." });
  }

  const newComment = {
    comment: req.body.comment,
    createdAt: new Date(),
    orderId: req.params.orderId,
    username: req.user.username,
    userImage: req.user.imageUrl,
  };
  db.doc(`/orders/${req.params.orderId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Order not found" });
      }
      let currentDate = newComment.createdAt;
      let rTime = new Date(doc.data().requestedTime * 1000);

      if (currentDate.getHours() > rTime.getHours()) {
        return res.status(400).json({ error: "The order is expired!" });
      } else {
        if (
          currentDate.getHours() === rTime.getHours() &&
          currentDate.getMinutes() > rTime.getMinutes()
        ) {
          return res.status(400).json({ error: "The order is expired!" });
        } else {
          db.collection("comments").add(newComment);
          return res.status(201);
        }
      }
    })
    .then(() => {
      res.json({ message: "Document created successfully" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};

exports.deleteOrder = (req, res) => {
  const document = db.doc(`/orders/${req.params.orderId}`);
  document
    .get()
    .then((doc) => {
      const orderRequestedTime = new Date(doc.data().requestedTime * 1000);
      const currentTime = new Date();
      console.log(orderRequestedTime.getDate());
      console.log(currentTime.getDate());
      console.log(orderRequestedTime.getHours());
      console.log(currentTime.getHours());
      console.log(orderRequestedTime.getMinutes());
      console.log(currentTime.getMinutes());
      if (
        orderRequestedTime.getDate() !== currentTime.getDate() ||
        orderRequestedTime.getMonth() !== currentTime.getMonth() ||
        orderRequestedTime.getFullYear() !== currentTime.getFullYear()
      ) {
        return res.status(404).json({ error: "Order is finished" });
      }
      if (orderRequestedTime.getHours() === currentTime.getHours()) {
        if (orderRequestedTime.getMinutes() <= currentTime.getMinutes()) {
          return res.status(404).json({ error: "Order is finished" });
        }
      } else if (orderRequestedTime.getHours() < currentTime.getHours()) {
        return res.status(404).json({ error: "Order is finished" });
      }

      if (!doc.exists) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (doc.data().username !== req.user.username) {
        if (req.user.username === "admin") {
          return document.delete();
        } else return res.status(403).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Order deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.editOrder = (req, res) => {
  const document = db.doc(`/orders/${req.params.orderId}`);
  document.get().then((doc) => {
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (req.body.orderName.trim() === "") {
      return res.status(400).json({ orderName: "Order must not be empty." });
    }

    const newOrder = req.body;

    if (doc.data().username !== req.user.username) {
      if (req.user.username === "admin") {
        document.update(newOrder);
        return res.json({
          message: `document ${req.params.orderId} edited successfully`,
        });
      }
      return res.status(403).json({ error: "Unauthorized" });
    }
    document
      .update(newOrder)
      .then((el) => {
        res.json({
          message: `document ${req.params.orderId} edited successfully`,
        });
      })
      .catch((err) => {
        res.status(500).json({ error: "something went wrong" });
        console.log(err);
      });
  });
};
