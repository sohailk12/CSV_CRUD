import express from "express";
import router from "./Routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/',router);
app.listen(PORT,()=>{
    console.log(`Server running on port: ${PORT}`);
})
