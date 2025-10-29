// Initialize the PDF.js library
const pdfjsLib = window['pdfjs-dist/build/pdf'];
// Ensure that PDF.js is loaded correctly
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
} else {
    console.error('PDF.js library is not loaded');
}
// Path to the PDF file
const pdfPath = 'Aletha_Spang_CV_2025_2.pdf';
let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    qualityScale = 3.5,  // Controls the resolution/quality of PDF
    displayScale = 2.5, // Controls the display size
    canvas = document.getElementById('pdf-render'),
    ctx = canvas.getContext('2d');

// Store calculated scales to reuse for all pages
let calculatedFitScale = null;
let calculatedFinalScale = null;

// Function to calculate the appropriate scale (only done once)
function calculateScales() {
    if (calculatedFitScale !== null) {
        return; // Already calculated
    }
    
    // Get the original viewport at scale 1.0 (using first page)
    pdfDoc.getPage(1).then(function(page) {
        const originalViewport = page.getViewport({ scale: 1.0 });
        
        // Get container width
        const container = document.getElementById('canvas-container') || canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // Calculate scale to fit width with some padding
        const padding = 40;
        calculatedFitScale = (containerWidth - padding) / originalViewport.width;
        
        // Apply display scale to control how much of the container the PDF fills
        calculatedFinalScale = calculatedFitScale * displayScale;
        
        // Now render the current page with these calculated scales
        renderPage(pageNum);
    });
}

// Function to render a page with high quality and proper sizing
function renderPage(num) {
    pageRendering = true;
    
    // If scales haven't been calculated yet, calculate them first
    if (calculatedFitScale === null) {
        calculateScales();
        return; // The calculation function will call renderPage again when done
    }
    
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function(page) {
        // Get device pixel ratio for higher quality on high-DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Create viewport for display size using the pre-calculated scale
        const displayViewport = page.getViewport({ scale: calculatedFinalScale });
        
        // Create viewport for rendering (higher resolution)
        const renderViewport = page.getViewport({ scale: calculatedFinalScale * qualityScale * pixelRatio });
        
        // Set canvas size to the high-resolution dimensions
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        
        // Use CSS to scale the canvas down to the display size
        canvas.style.width = displayViewport.width + 'px';
        canvas.style.height = displayViewport.height + 'px';
        
        // Render the PDF at high resolution
        const renderContext = {
            canvasContext: ctx,
            viewport: renderViewport
        };
        
        const renderTask = page.render(renderContext);
        
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

// Add resize handler - recalculate scales when window is resized
window.addEventListener('resize', function() {
    if (pdfDoc) {
        // Reset calculated scales so they'll be recalculated
        calculatedFitScale = null;
        calculatedFinalScale = null;
        renderPage(pageNum);
    }
});

// Event listeners for the navigation buttons
document.getElementById('prev-page').addEventListener('click', showPrevPage);
document.getElementById('next-page').addEventListener('click', showNextPage);

// Load the PDF document
pdfjsLib.getDocument(pdfPath).promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page-count').textContent = pdfDoc.numPages;
    // Initial page rendering (will calculate scales first)
    renderPage(pageNum);
}).catch(function(error) {
    console.error('Error loading PDF document:', error);
});

// Function for fullscreen mode
function resizeCanvas() {
    if (pdfDoc) {
        // Reset calculated scales for fullscreen mode
        calculatedFitScale = null;
        calculatedFinalScale = null;
        renderPage(pageNum);
    }
}
