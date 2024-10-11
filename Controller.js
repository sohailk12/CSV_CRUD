import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';

//file path
const csvFilePath = './data.csv';

const setPathandHeader = async ()=>{
   return await createCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'id', title: 'id' },
            { id: 'name', title: 'name' },
            { id: 'email', title: 'email' }
        ]
    });
}

const csvFileRead = async ()=> {
    const fileContent = await fs.readFile(csvFilePath, 'utf8');
        //parsing into array of objects
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true
        });
    return records;
}

export const readData = async (req, res) => {
    try {
        //reading
        const records = await csvFileRead();
        //returning response
        return res.json(records);
    } catch (err) {
        if (err.code === "ENOENT") {
            console.error("File not found:", err.path);
        } else {
            console.error("Error reading file:", err);
        }
        return null;
    }
};

const checkID = (arr,value) =>{
    for(let i=0;i<arr.length;i++){
        if(parseInt(arr[i])===parseInt(value)){
            return true;
        }
    }
    return false;
}

export const addData = async (req, res) => {
    //reading
        const records = await csvFileRead();
    //getting Data from body
    const incomingData = req.body;    
    
    //storing existing records ID's
    const recordIds = records.map(elem=>parseInt(elem.id));

    //Finding Maximum id in existing records
    let maxId = recordIds.reduce((max, current) => {
        return parseInt(current) > parseInt(max) ? current : max;
    }, '0');
    
    //defining function to add id
    const addIdIfMissing = (obj) => {
            if (!obj.id) {  
                maxId++;  
                obj.id = maxId; 
            }
            return obj; 
        }; 

    //initializing empty array
    let newEntries = [];

    //Checks if requesting Data has array of Objects
    if(Array.isArray(incomingData)){
        const allHaveEitherKey= incomingData.every(obj => 'name' in obj || 'email' in obj);
        if (allHaveEitherKey) {
            newEntries = incomingData.map(elem => addIdIfMissing(elem)).filter(elem=>!checkID(recordIds,elem.id));
        }
    }
    //if requesting Data has only Object
    else{
        if (incomingData && incomingData.name || incomingData.email) {
            const updatedData = addIdIfMissing(incomingData);
           if(!recordIds.includes(parseInt(updatedData.id))){
            newEntries.push(updatedData);
             }
        }
    }
    
    //checks if there is unique incoming data
    if(newEntries.length>0){
    const combinedData =[...records, ...newEntries];
    combinedData.sort((a,b)=>a.id - b.id);

    //setting path and header
    const csvWriter = await setPathandHeader();

    //writing
    csvWriter.writeRecords(combinedData)
    .then(() => res.json(combinedData))
    }
    //if there is no Unique incoming Data then return response
    else{
        res.status(404).send({message:'No Data Found to be Added'})
    }
};

export const updateData = async (req,res) =>{

    //incoming Data from body
    const newData = req.body;
    //initializing empty array
    let updatedEntries = [];

    //reading Data
    const records = await csvFileRead();
    //storing existing record id's
    const recordIds = records.map(elem => parseInt(elem.id));

    //Checks if requesting Data has array of Objects and has an id key
    if(Array.isArray(newData)){
        updatedEntries = newData.filter(obj => 'id' in obj);
    }
    //if requesting Data has only Object and has an id key
    else{
        if (newData && newData.id) {
            updatedEntries.push(newData);
        }
    }

    //updating Data
    if (updatedEntries.length > 0) {
        const updatedRecords = records.map(record=>{
            const matchingEntry = updatedEntries.find(entry => parseInt(entry.id) === parseInt(record.id));
            if (matchingEntry) {
                return { ...record, ...matchingEntry };
            }
            return record;
        })

    //setting path and header
        const csvWriter = await setPathandHeader();
        //writing Data
        csvWriter.writeRecords(updatedRecords)
        .then(()=>res.json(updatedRecords))
    }
    else{
        res.send('404 Not Found')
    }
}
export const deleteData = async (req,res) =>{

    //incoming Id from URL
    const recordID = req.params.id;
    //reading
    const records = await csvFileRead();

    //checks if there is no records in the file
    if(records.length){
    
    //filter out record that matches id with existing records and save other records
    const updatedRecords = records.filter((record)=> parseInt(record.id) !== parseInt(recordID));   
    
    if (updatedRecords.length === records.length) {
        res.status(404).send({ message: 'Record not found' });
    
    }

    //sorting records if sequence is mismanaged
    const newarr =updatedRecords.sort((a,b)=>a.id - b.id);

    //setting path and header
    const csv = await setPathandHeader();
    //write
    csv.writeRecords(newarr)
    .then(()=>res.json(newarr)) 
    }
    else{
        //if file is empty return response
        res.send('No Records in File')
    }
}

export const deleteMultiple = async (req,res)=>{
    //incoming from body 
    const recordIds = req.body;
    //reading
    const records = await csvFileRead();
    //checks if there is no records in the file

    if(records.length){
    
    let recordsTobeDeleted = [];

    //Checks if requesting Data has array of Object
    if(Array.isArray(recordIds)){
        for(let i=0;i<recordIds.length;i++){
            recordsTobeDeleted = recordIds[i].ids;
        }
    }
    //if requesting Data has only Object
    else{
        if (recordIds && recordIds.ids) {
            recordsTobeDeleted = recordIds.ids;
        }
    }

    //filter out record that matches id with existing records Id's and save other records
    const updatedRecords =records.filter(record=>!checkID(recordsTobeDeleted,record.id));

    
    //setting path and header
    const csv = await setPathandHeader();
    //write
    csv.writeRecords(updatedRecords)
    .then(()=>res.json(updatedRecords))
    }
    else{
        //if file is empty return response
        res.send('No Records in File')
    }
}