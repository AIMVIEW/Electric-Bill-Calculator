const express = require('express');
const app = express();
const port = 8080;

const fs = require("fs");
const { stringify } = require("csv-stringify");
const { pipeline } = require("stream/promises");

app.use(express.json());

const columns = [
  "appliance_name",
  "unit"
];

// Define a route for GET requests to the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/calculate',(req,res) => {
  const data = req.body;
  console.log(data)

  async function writeCSV() {
    const stringifier = stringify({ header: true, columns: columns });
    const writableStream = fs.createWriteStream("output.csv");

    // Register event listeners BEFORE initiating writes to prevent missing events
    writableStream.on("finish", () => {
      console.log("Finished writing CSV file");
    });

    writableStream.on("error", (error) => {
      console.error("Write stream error:", error.message);
    });

    // Use pipeline for proper backpressure handling and error propagation
    await pipeline(
      async function* () {
        // Generate data as a readable stream
        for (const row of data) {
          yield row;
        }
      },
      stringifier,
      writableStream
    );
  }

  writeCSV().catch((error) => {
    console.error("Failed to write CSV:", error.message);
    process.exit(1);
  });
})

// Start the server
app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});