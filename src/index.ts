import express, { Request, Response } from 'express';
import multer from 'multer';
import  CloudConvert from 'cloudconvert';
import { config } from 'dotenv';
import path from 'path';

config();
const app = express();
const upload = multer();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));


const cloudConvert = new CloudConvert(process.env.CLOUD_CONVERT_API_KEY ?? '');
let urls: Array<string> = []

app.post('/convert', upload.array('files'), async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    try {
        urls = []
        for (const file of files) {
            if(!file) {
                return res.status(400).send({message: "File is required"});
            }
            //Create Job
            let job = await cloudConvert.jobs.create({
                "tasks": {
                    "import-2": {
                        "operation": "import/base64",
                        "file": `${file.buffer.toString('base64')}`,
                        "filename": `${file.originalname}`
                    },
                    "task-1": {
                        "operation": "convert",
                        "input_format": "docx",
                        "output_format": "pdf",
                        "engine": "libreoffice",
                        "input": [
                            "import-2"
                        ],
                        "pdf_a": false,
                        "engine_version": "7.2.6"
                    },
                    "export-1": {
                        "operation": "export/url",
                        "input": [
                            "task-1"
                        ],
                        "inline": true,
                        "archive_multiple_files": false
                    }
                },
                "tag": "jobbuilder"
            });
            // Start Task
            job = await cloudConvert.jobs.wait(job.id);
            // Convert to url
            const result = cloudConvert.jobs.getExportUrls(job)[0];
            // Add url to array
            urls.push('https://storage.cloudconvert.com/tasks/0ee7cacc-86e6-4724-a153-d3d73efd23d1/Prueba%20TheBar%20%28Nuevos%20Codigos%29.pdf?AWSAccessKeyId=cloudconvert-production&Expires=1674241517&Signature=SAWh%2BVLCMI7W1HZdOePd7OjBVbY%3D&response-content-disposition=inline%3B%20filename%3D"Prueba%20TheBar%20%28Nuevos%20Codigos%29.pdf"&response-content-type=application%2Fpdf');
            urls.push('https://storage.cloudconvert.com/tasks/66bfabbe-ab04-4138-b160-55e872045d0a/Test%20-%20Copy.pdf?AWSAccessKeyId=cloudconvert-production&Expires=1674241196&Signature=IEUPs4T9hjCU1Z8fk8CP8zFqzL4%3D&response-content-disposition=inline%3B%20filename%3D"Test%20-%20Copy.pdf"&response-content-type=application%2Fpdf');
        }

        res.redirect('/download')
    } catch (error) {
        console.log('',error);
        res.status(500).send('An error occurred');
    }
});

app.get('/download', (req: Request, res: Response) => {
    res.render('download', { urls: urls });
});

app.listen(5556, () => {
  console.log('Server running on port 5556');
});

app.use(express.static('public'));