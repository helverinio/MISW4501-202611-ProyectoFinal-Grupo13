# Troubleshooting

## Error: `Connection refused` bajo carga alta (Windows)

**Causa**: Windows limita el pool de puertos efímeros (~16K). Bajo carga alta (>500 req/s) los puertos se agotan.

**Solución**:
```powershell
# Ampliar rango de puertos efímeros en Windows
netsh int ipv4 set dynamicport tcp start=1025 num=64510
# Reducir tiempo de reutilización TIME_WAIT
reg add HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters /v TcpTimedWaitDelay /t REG_DWORD /d 30 /f
```
O usar `docker-compose-scaled.yml` que distribuye la carga entre 3 instancias con Nginx.

---

## Error: `Payment service temporarily unavailable, circuit_open: true`

**Causa**: El circuit breaker de `reservas→pagos` está abierto (5 fallos consecutivos).

**Diagnóstico**: Ver logs de `reservas`: `docker-compose logs -f reservas`

**Solución**: Verificar que `pagos` esté corriendo y respondiendo:
```bash
curl http://localhost:5002/api/v1/health
docker-compose restart pagos
```
El circuito se cierra automáticamente tras 30s si las llamadas vuelven a ser exitosas.

---

## Error: Redis lock no se libera / hold queda bloqueado

**Causa**: El proceso murió mientras tenía el lock. Redis lo libera automáticamente tras TTL (30s).

**Diagnóstico**:
```bash
# Ver claves de lock activas
docker-compose exec redis redis-cli keys "room_hold_lock:*"
# Ver TTL restante
docker-compose exec redis redis-cli ttl "room_hold_lock:<room_id>:<in>:<out>"
```

**Solución**: Esperar 30s o eliminar la clave manualmente:
```bash
docker-compose exec redis redis-cli del "room_hold_lock:<room_id>:<in>:<out>"
```

---

## Error: `409 Conflict` al crear hold

**Causa**: Ya existe un hold activo para esa habitación y rango de fechas.

**Solución**: Esperar a que expire (TTL = 15 min por defecto) o eliminarlo:
```bash
DELETE /api/v1/holds/{hold_id}
```

---

## Error: Pago queda en estado `pendiente` indefinidamente

**Causa**: El paso `POST /api/v1/payments/{id}/process` no fue llamado, o `ext-payments` no respondió.

**Diagnóstico**: Revisar logs de `pagos` y estado del payment:
```bash
curl http://localhost:5002/api/v1/payments/{id}
docker-compose logs -f pagos
```

**Solución automática**: El scheduler de `pagos` marca como `abandonado` todo payment pendiente con más de 20 minutos. Se ejecuta cada 60 segundos.

---

## Error: ActiveMQ no conecta / mensajes en DLQ

**Causa**: `activemq` no levantó antes que `reservas`/`pagos`, o hay errores en el procesamiento de mensajes.

**Diagnóstico**: Ver consola web ActiveMQ en http://localhost:8161/admin/ (admin/admin).
Revisar la queue `/topic/PaymentStatusUpdated.DLQ` para mensajes fallidos.

**Solución**: Reiniciar servicios en orden:
```bash
docker-compose restart activemq
docker-compose restart pagos reservas
```

---

## Error: Migraciones de BD no aplicadas

**Síntoma**: `relation "room_holds" does not exist` u otros errores de tabla.

**Causa**: Las migraciones de Flask-Migrate no corrieron o la BD está en estado inconsistente.

**Solución**:
```bash
# Limpiar y recrear (borra todos los datos)
docker-compose down -v
docker-compose up --build
```

---

## Cómo acceder a las BDs directamente

```bash
docker-compose exec reservas-db psql -U postgres -d reservas
docker-compose exec pagos-db psql -U postgres -d pagos
docker-compose exec ext-payments-db psql -U postgres -d ext_payments
```