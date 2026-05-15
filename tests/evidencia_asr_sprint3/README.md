# Evidencia ASR Sprint 3 — Scripts de validación

Scripts de benchmark y validación para los ASRs del Sprint 3 de TravelHub.

## ASRs cubiertos

| ASR   | Nombre                              | Modalidad de validación       | Umbral           |
|-------|-------------------------------------|-------------------------------|------------------|
| ASR05 | Procesamiento ágil de pagos         | Reutilizado de Sprint 2       | p95 ≤ 3 000 ms   |
| ASR06 | Carga rápida del histórico          | Benchmark automático          | p95 ≤ 2 000 ms*  |
| ASR17 | Cumplimiento GDPR/LGPD              | Inspección de código          | 0 incumplimientos|
| ASR18 | Auditoría de cambios                | Validación funcional          | Trazabilidad completa |

> \* El ASR define 1 000 ms server-side. El umbral cliente de 2 000 ms incorpora
> ~635–700 ms de overhead de red Colombia → AWS us-east-1 (ver Apéndice A de
> `docs/EVIDENCIA_ASR_SPRINT3.md`).

## Por qué no se ejecutan todos los benchmarks

- **ASR05 (pagos)**: El endpoint `POST /payments/{id}/process` ejecuta cobros reales
  contra el proveedor externo. Por instrucción del equipo no se re-ejecuta; se
  reutilizan los resultados validados del Sprint 2 (p95 = 864.0 ms ≤ 3 000 ms ✅).

- **ASR17 (GDPR)**: La validación de `POST /usuarios` enviaría correos de verificación
  reales. Se valida por inspección de código y evidencia de infraestructura (ver doc).

- **ASR18 (auditoría)**: Validación funcional basada en revisión de logs estructurados
  generados por `PUT /admin/reservas/{id}/estado` (HU-P-23) y trazas de Sprint 2.

## Prerrequisitos

```bash
pip install requests
```

El entorno virtual del proyecto (`.venv-1`) ya tiene `requests` instalado.

## Ejecución

```powershell
# Desde la raíz del repositorio
& .\.venv-1\Scripts\python.exe tests\evidencia_asr_sprint3\run_all.py
```

O con captura de salida:

```powershell
& .\.venv-1\Scripts\python.exe tests\evidencia_asr_sprint3\run_all.py 2>&1 | Tee-Object -FilePath tests\evidencia_asr_sprint3\run_all_output.txt
```

Para ejecutar sólo ASR06:

```powershell
& .\.venv-1\Scripts\python.exe tests\evidencia_asr_sprint3\asr06_historial_reservas.py
```

## Estructura de archivos

```
tests/evidencia_asr_sprint3/
├── conftest.py                  # Setup compartido: auth, discovery de IDs, utilidades
├── asr06_historial_reservas.py  # Benchmark ASR06 (100 llamadas GET /usuarios/{id}/reservas)
├── run_all.py                   # Orquestador: ejecuta ASR06, reporta ASR05/17/18
├── run_all_output.txt           # Salida capturada (generado al ejecutar)
└── README.md                    # Este archivo
```
