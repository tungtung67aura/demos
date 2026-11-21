from PIL import Image, ImageDraw, ImageFont
import json
f=ImageFont.truetype('/usr/share/fonts/truetype/sand-box/google/Press Start 2P/PressStart2P-Regular.ttf',8)
chars=' !"#$&%\'()*+,-./0123456789:;<=>?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz¡¿ÁÉÍÓÚÑÜáéíóúñü·×♥'
out={}
for c in chars:
    im=Image.new('L',(8,12),0); d=ImageDraw.Draw(im); d.text((0,2),c,font=f,fill=255)
    rows=[]
    for y in range(12):
        b=0
        for x in range(8):
            if im.getpixel((x,y))>127: b|=1<<(7-x)
        rows.append(b)
    out[c]=rows
open('js/fuente-datos.js','w').write('export const GLIFOS='+json.dumps(out,ensure_ascii=False)+';\n')
print(out['A'],out['Á'],out['g'])
# Mayúsculas acentuadas: letra completa + acento arriba (la fuente original las aplasta)
ac={'ÁÉÍÓÚ':[0b00001100,0b00011000],'Ñ':[0b00110100,0b01011000],'Ü':[0,0b01101100]}
for grupo,arr in ac.items():
    for c in grupo:
        base={'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ñ':'N','Ü':'U'}[c]
        out[c]=arr+out[base][2:]
open('js/fuente-datos.js','w').write('export const GLIFOS='+json.dumps(out,ensure_ascii=False)+';\n')
