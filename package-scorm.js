const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'scorm-package');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Fix index.html to use relative paths
const indexPath = path.join(__dirname, 'build', 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Replace absolute paths with relative paths
  indexContent = indexContent.replace(/src="\/static\//g, 'src="./static/');
  indexContent = indexContent.replace(/href="\/static\//g, 'href="./static/');
  indexContent = indexContent.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');
  indexContent = indexContent.replace(/href="\/logo192\.png"/g, 'href="./logo192.png"');
  indexContent = indexContent.replace(/href="\/manifest\.json"/g, 'href="./manifest.json"');
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('Fixed index.html paths for SCORM');
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(outputDir, 'scorm-package.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('SCORM package created successfully!');
  console.log('Total bytes: ' + archive.pointer());
});

// Handle errors
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files from build directory
archive.directory(path.join(__dirname, 'build'), false);

// Add manifest and XSD schema files
archive.file(path.join(__dirname, 'public', 'imsmanifest.xml'), { name: 'imsmanifest.xml' });
archive.file(path.join(__dirname, 'public', 'imscp_rootv1p1p2.xsd'), { name: 'imscp_rootv1p1p2.xsd' });
archive.file(path.join(__dirname, 'public', 'adlcp_rootv1p2.xsd'), { name: 'adlcp_rootv1p2.xsd' });
archive.file(path.join(__dirname, 'public', 'imsmd_rootv1p2p1.xsd'), { name: 'imsmd_rootv1p2p1.xsd' });
archive.file(path.join(__dirname, 'public', 'ims_xml.xsd'), { name: 'ims_xml.xsd' });

// Finalize the archive
archive.finalize(); 