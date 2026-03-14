# TravelHub docfx con DocFX

Este directorio contiene la documentacion funcional de TravelHub en formato DocFX.

## Estructura principal

```text
docfx/
  index.md
  manual-intro.md
  travelhub-introduccion.md
  faq.md
  glosario.md
  toc.yml
  portal-web/
  app-movil/
  portal-admin/
  images/
```

## Requisitos

- Tener DocFX instalado en la maquina.
- Ejecutar los comandos desde la raiz del repositorio.

## Compilar localmente

```powershell
docfx docfx.json
```

El sitio generado quedara en la carpeta `_site`.

## Ejecutar en modo local

```powershell
docfx serve _site
```

Despues, abra en el navegador la URL local que muestre DocFX.

## Recomendaciones de mantenimiento

- Guardar capturas en `docfx/images/`.
- Reemplazar los marcadores `[AGREGAR CAPTURA: ...]` por imagenes reales.
- Validar los textos marcados como `[DESCRIBIR AQUI EL FLUJO REAL SEGUN HTML]`.
- Mantener actualizados los `toc.yml` cuando se agreguen nuevas paginas.
