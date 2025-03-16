#!/bin/bash

# Script para gerar favicon a partir do arquivo SVG
# Requer: ImageMagick (comando 'convert')

echo "Gerando favicon.ico a partir do SVG..."

# Verifica se o ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "Este script requer ImageMagick. Por favor instale usando:"
    echo "sudo apt-get install imagemagick    # Ubuntu/Debian"
    echo "sudo yum install imagemagick        # CentOS/RHEL"
    echo "brew install imagemagick            # macOS com Homebrew"
    exit 1
fi

# Verifica se o arquivo SVG existe
if [ ! -f "public/storefront-icon.svg" ]; then
    echo "O arquivo SVG não foi encontrado em public/storefront-icon.svg"
    exit 1
fi

# Cria diretório temporário
mkdir -p temp_favicon

# Gera favicons em vários tamanhos
convert -background transparent public/storefront-icon.svg -resize 16x16 temp_favicon/favicon-16x16.png
convert -background transparent public/storefront-icon.svg -resize 32x32 temp_favicon/favicon-32x32.png
convert -background transparent public/storefront-icon.svg -resize 48x48 temp_favicon/favicon-48x48.png
convert -background transparent public/storefront-icon.svg -resize 64x64 temp_favicon/favicon-64x64.png

# Combina em um único arquivo .ico
convert temp_favicon/favicon-16x16.png temp_favicon/favicon-32x32.png temp_favicon/favicon-48x48.png temp_favicon/favicon-64x64.png public/favicon.ico

# Limpa arquivos temporários
rm -rf temp_favicon

echo "Favicon gerado com sucesso em public/favicon.ico" 