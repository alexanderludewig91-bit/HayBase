// Konvertiert logo.svg zu logo.png
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertLogo() {
  try {
    const svgPath = path.join(__dirname, 'logo.svg');
    const pngPath = path.join(__dirname, 'logo.png');

    if (!fs.existsSync(svgPath)) {
      console.error('❌ logo.svg nicht gefunden!');
      process.exit(1);
    }

    console.log('🔄 Konvertiere logo.svg zu logo.png...');

    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(pngPath);

    console.log('✅ logo.png erfolgreich erstellt!');
    console.log('📦 Sie können jetzt ausführen:');
    console.log('   pwa-asset-generator logo.png public --icon-only');
  } catch (error) {
    console.error('❌ Fehler beim Konvertieren:', error.message);
    console.log('\n💡 Alternative: Konvertieren Sie logo.svg online zu PNG:');
    console.log('   https://cloudconvert.com/svg-to-png');
    process.exit(1);
  }
}

convertLogo();

