const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer"); // Naya package file uploads ke liye
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Setup: Files ko kahan aur kis naam se save karna hai
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // public/uploads folder me save hogi
    },
    filename: function (req, file, cb) {
        // Same naam ki files overwrite na hon, isliye time add kar rahe hain
        cb(null, Date.now() + "-" + file.originalname); 
    }
});

// File upload limit humne hata di hai taaki kitni bhi badi file aaye
const upload = multer({ storage: storage });

app.use(express.static("public")); 

// File Upload Route (Naya)
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    // File upload hone ke baad uska link wapas bhejenge
    const fileUrl = "/uploads/" + req.file.filename;
    res.json({ fileUrl: fileUrl, fileName: req.file.originalname });
});

io.on("connection", (socket) => {
    console.log(`🟢 User Connected (ID: ${socket.id})`);

    socket.on("chat message", (data) => {
        if (data.type === 'text') {
            console.log(`💬 [${data.user}]: ${data.text}`);
        } else {
            console.log(`📁 [${data.user}] shared a file/image: ${data.fileName}`);
        }
        io.emit("chat message", data);
    });

    socket.on("disconnect", () => {
        console.log(`🔴 User Disconnected (ID: ${socket.id})`);
    });
});

const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server Running on port ${PORT} (Large File Support Enabled)`);
});