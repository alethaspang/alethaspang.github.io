// Initialize the PDF.js library
const pdfjsLib = window['pdfjs-dist/build/pdf'];

// Ensure that PDF.js is loaded correctly
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
} else {
    console.error('PDF.js library is not loaded');
}

// Path to the PDF file
const pdfPath = 'Pueblo_Public_Art_Report.pdf';

let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 3,  
    canvas = document.getElementById('pdf-render'),
    ctx = canvas.getContext('2d');

// Function to render a page
function renderPage(num) {
    pageRendering = true;

    // Fetch the page
    pdfDoc.getPage(num).then(function(page) {
        let viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page into the canvas context
        let renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        let renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function() {
            pageRendering = false;

            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    // Update page counters
    document.getElementById('page-num').textContent = num;
}

// Function to queue rendering of the next page
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Function to show the previous page
function showPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}

// Function to show the next page
function showNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}

// Event listeners for the navigation buttons
document.getElementById('prev-page').addEventListener('click', showPrevPage);
document.getElementById('next-page').addEventListener('click', showNextPage);

// Load the PDF document
pdfjsLib.getDocument(pdfPath).promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page-count').textContent = pdfDoc.numPages;

    // Initial page rendering
    renderPage(pageNum);
}).catch(function(error) {
    console.error('Error loading PDF document:', error);
});
