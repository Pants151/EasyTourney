const fs = require('fs');
const path = require('path');

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // replace basic relative imports pointing to outside components/services/etc
            content = content.replace(/from\s+['"]\.\.\/(.*?)['"]/g, "from '../../$1'");

            // fix images
            content = content.replace(/import\s+(.*?)\s+from\s+['"]\.\.\/(.*?)['"]/g, "import $1 from '../../$2'");

            // fix just import '../...' without from
            content = content.replace(/import\s+['"]\.\.\/(.*?)['"]/g, "import '../../$1'");

            // fix TournamentForm.css
            content = content.replace(/import\s+['"]\.\/TournamentForm\.css['"]/g, "import '../TournamentForm.css'");

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated ' + fullPath);
            }
        }
    });
}
processDir(path.join(__dirname, 'frontend/src/pages'));
