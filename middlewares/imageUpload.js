import multer from "multer";

// Memory storage for in-memory buffer (used for uploading to ImageKit)
const storage = multer.memoryStorage();

// Initialize multer with memory storage
const upload = multer({ storage });

// Define fields for banner and dynamic ticket images
// const uploadEventAssets = (req, res, next) => {
//     console.log("Request Body:", req.body); // Log the entire body
//   // Check if the 'data' field exists in the request body
//   if (!req.body.data) {
//     return res.status(400).json({ message: 'Missing event data' });
//   }

//   // Try to parse the event data
//   let fileFields = [{ name: 'banner', maxCount: 1 }];  // Add banner as a fixed field

//   try {
//     // Log the raw data for debugging purposes
//     console.log("Raw Data:", req.body.data);
    
//     const parsedData = JSON.parse(req.body.data);  // Parse JSON from the 'data' field
    
//     // Log the parsed data to check the structure
//     console.log("Parsed Data:", parsedData);
    
//     // Check for tickets field and add dynamic ticket image fields
//     if (parsedData?.tickets && Array.isArray(parsedData.tickets)) {
//       parsedData.tickets.forEach((_, index) => {
//         fileFields.push({ name: `ticketImage-${index}`, maxCount: 1 });
//       });
//     } else {
//       return res.status(400).json({ message: 'Missing or invalid ticket data' });
//     }
//   } catch (err) {
//     console.error("Error parsing data:", err);
//     return res.status(400).json({ message: 'Invalid data format' });
//   }

//   // Now, apply multer with dynamic fields
//   upload.fields(fileFields)(req, res, next);
// };

// // Export in ESM style
// export { uploadEventAssets };


export const uploadEventAssets = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'ticketImage-0', maxCount: 1 },
  { name: 'ticketImage-1', maxCount: 1 },
]);
