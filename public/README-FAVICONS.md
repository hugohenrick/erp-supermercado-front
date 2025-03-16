# Instruções para Gerar Favicons

Este diretório contém os arquivos necessários para criar os favicons e ícones da aplicação SuperERP.

## Arquivos Disponíveis

- `storefront-icon.svg` - O ícone de loja (Storefront) em formato SVG
- `generate-favicon.sh` - Script para gerar o favicon.ico
- `generate-png-icons.sh` - Script para gerar os ícones PNG em diferentes tamanhos

## Como Gerar os Ícones

Para gerar todos os favicons e ícones necessários, siga estas instruções:

### Pré-requisitos

Você precisa ter o ImageMagick instalado no seu sistema.

- **Ubuntu/Debian**: `sudo apt-get install imagemagick`
- **CentOS/RHEL**: `sudo yum install imagemagick`
- **macOS com Homebrew**: `brew install imagemagick`
- **Windows**: Baixe o instalador em [imagemagick.org](https://imagemagick.org/script/download.php)

### Passos para Gerar os Ícones

1. Abra um terminal/prompt de comando
2. Navegue até a pasta `public` do projeto:
   ```bash
   cd public
   ```
3. Execute os scripts:
   ```bash
   # Execute os scripts (certifique-se de que eles são executáveis)
   ./generate-favicon.sh
   ./generate-png-icons.sh
   ```

Isso irá gerar:
- `favicon.ico` - Favicon para navegadores tradicionais
- `logo192.png` - Ícone usado para Apple Touch Icon e outros propósitos
- `logo512.png` - Ícone de alta resolução para PWA e telas de inicialização

### Verificação

Após gerar os ícones, verifique se todos os arquivos abaixo estão presentes no diretório `public`:
- `favicon.ico`
- `storefront-icon.svg`
- `logo192.png`
- `logo512.png`
- `manifest.json`

### Alternativa Online

Se você preferir, pode usar ferramentas online para converter o SVG em favicons:

1. [Favicon.io](https://favicon.io/favicon-converter/)
2. [Real Favicon Generator](https://realfavicongenerator.net/)

Basta fazer upload do arquivo `storefront-icon.svg` e seguir as instruções. 