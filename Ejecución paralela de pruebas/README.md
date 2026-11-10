# Ejecución paralela de pruebas con pytest-xdist

Ejemplo sencillo: 8 pruebas que tardan 2 segundos cada una.

## Instalación

```bash
pip install pytest pytest-xdist
```

## Ejecución

```bash
# En serie (un solo proceso): ~16 s
python -m pytest -v -s

# En paralelo con 4 workers: ~8 s
python -m pytest -v -s -n 4

# Un worker por núcleo de CPU
python -m pytest -n auto
```

Con `-n 4`, cada línea de resultado se marca con el worker que la ejecutó
(`[gw0]`, `[gw1]`, `[gw2]`, `[gw3]`).

## Cómo funciona

`pytest-xdist` lanza N procesos de Python (workers). El proceso principal recopila
las pruebas, las reparte entre los workers y junta los resultados. Cada worker
corre en su propio proceso con su propia memoria, por lo que las pruebas deben
ser independientes entre sí (sin depender del orden ni de estado compartido).
