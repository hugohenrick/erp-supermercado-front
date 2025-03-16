#!/bin/bash

# Script para gerar ícones PNG a partir do arquivo SVG
# Requer: ImageMagick (comando 'convert')

echo "Gerando ícones PNG a partir do SVG..."

# Verifica se o ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "Este script requer ImageMagick. Por favor instale usando:"
    echo "sudo apt-get install imagemagick    # Ubuntu/Debian"
    echo "sudo yum install imagemagick        # CentOS/RHEL"
    echo "brew install imagemagick            # macOS com Homebrew"
    exit 1
fi

# Verifica se o arquivo SVG existe
if [ ! -f "storefront-icon.svg" ]; then
    echo "O arquivo SVG não foi encontrado em storefront-icon.svg"
    exit 1
fi

# Gera PNGs em vários tamanhos
convert -background transparent storefront-icon.svg -resize 192x192 logo192.png
convert -background transparent storefront-icon.svg -resize 512x512 logo512.png

echo "Ícones PNG gerados com sucesso:"
echo "- logo192.png (para Apple Touch Icon)"
echo "- logo512.png (para aplicativos de tela inicial)" 