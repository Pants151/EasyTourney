const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages');
const files = fs.readdirSync(pagesDir);

const pages = new Set();
// Identify pages
files.forEach(file => {
    if (file.endsWith('.js') && file !== 'index.js') {
        pages.add(file.replace('.js', ''));
    }
});

pages.forEach(page => {
    const pageDir = path.join(pagesDir, page);
    if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir);
    }

    // Move JS
    const oldJs = path.join(pagesDir, `${page}.js`);
    const newJs = path.join(pageDir, `${page}.js`);
    if (fs.existsSync(oldJs)) {
        let content = fs.readFileSync(oldJs, 'utf8');

        // Update imports that go outside pages dir
        // Negative lookahead to ensure we don't apply it to strings already starting with ../../
        content = content.replace(/(from|import)\s+['"]\.\.\/(?!\.\.\/)([^'"]+)['"]/g, "$1 '../../$2'");

        // Fix TournamentForm.css 
        content = content.replace(/import\s+['"]\.\/TournamentForm\.css['"]/g, "import '../TournamentForm.css'");

        fs.writeFileSync(newJs, content, 'utf8');
        fs.unlinkSync(oldJs);
    }

    // Move CSS
    const oldCss = path.join(pagesDir, `${page}.css`);
    const newCss = path.join(pageDir, `${page}.css`);
    if (fs.existsSync(oldCss)) {
        fs.renameSync(oldCss, newCss);
    }
});

console.log('Done moving and updating pages!');
