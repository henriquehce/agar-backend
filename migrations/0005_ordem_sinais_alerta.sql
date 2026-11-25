-- Ordem dos sinais de alerta invertida a pedido da banca/orientadora: do mais leve
-- (atenção) ao mais grave (emergência), para a tela não abrir com o nível mais alarmante.
-- Rollback: UPDATE sinais_alerta SET ordem = CASE nivel WHEN 'EMERGENCIA' THEN 0 WHEN 'URGENTE' THEN 1 WHEN 'ATENCAO' THEN 2 ELSE ordem END;
UPDATE sinais_alerta SET ordem = CASE nivel WHEN 'ATENCAO' THEN 0 WHEN 'URGENTE' THEN 1 WHEN 'EMERGENCIA' THEN 2 ELSE ordem END;
