"""Ejemplo sencillo de ejecución paralela con pytest-xdist.

Cada prueba simula una tarea lenta (por ejemplo una llamada a una API o la
carga de una página) con time.sleep(). En serie las pruebas se ejecutan una
tras otra; en paralelo, xdist las reparte entre varios procesos (workers).
"""
import os
import time

import pytest


def calcular_iva(precio, tasa=0.18):
    return round(precio * (1 + tasa), 2)


def es_palindromo(texto):
    limpio = "".join(c.lower() for c in texto if c.isalnum())
    return limpio == limpio[::-1]


def _tarea_lenta():
    time.sleep(2)  # simula una operación que tarda 2 segundos
    # PYTEST_XDIST_WORKER vale gw0, gw1, ... en paralelo y no existe en serie
    return os.environ.get("PYTEST_XDIST_WORKER", "principal")


@pytest.mark.parametrize("precio, esperado", [(100, 118.0), (50, 59.0), (10, 11.8), (0, 0.0)])
def test_iva(precio, esperado):
    worker = _tarea_lenta()
    print(f"[{worker}] iva({precio})")
    assert calcular_iva(precio) == esperado


@pytest.mark.parametrize("texto, esperado", [
    ("Anita lava la tina", True),
    ("Arequipa", False),
    ("Somos o no somos", True),
    ("Tecnologías", False),
])
def test_palindromo(texto, esperado):
    worker = _tarea_lenta()
    print(f"[{worker}] palindromo({texto!r})")
    assert es_palindromo(texto) is esperado
