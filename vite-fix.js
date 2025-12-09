import { spawn } from 'child_process';

// On lance vite avec les bons arguments, en ignorant ceux de l'environnement
const vite = spawn('vite', ['--host', '0.0.0.0', '--port', '9002'], { 
    stdio: 'inherit', 
    shell: true 
});

vite.on('close', (code) => process.exit(code));