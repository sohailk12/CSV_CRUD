import express from "express";
import fs from "fs";

const app = express();

app.get('/app',async (req,res)=>{
    const csvFilePath = './largeFile.txt';
    await fs.readFile(csvFilePath,'utf8',(err,data)=>{
        if (err) {
            if (err.code === "ENOENT") {
                console.error("File not found:", err.path);
            } else {
                console.error("Error reading file:", err);
            }
            return;
        }
        return res.send({app:"app",file:data})
    });
    
});
app.get('/app1',(req,res)=>{

    return res.send("app1")
});
app.listen(3000,()=>{
    console.log('Server running at port: 3000');
})