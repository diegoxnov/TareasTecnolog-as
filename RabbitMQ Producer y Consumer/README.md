# RabbitMQ – "Hello World" Producer / Consumer (Python)

Recreación del tutorial 1: https://www.rabbitmq.com/tutorials/tutorial-one-python
usando la imagen oficial de Docker `rabbitmq` (https://hub.docker.com/_/rabbitmq).

```
Producer (send.py) ──► cola "hello" ──► Consumer (receive.py)
```

## Requisitos

- Docker (Desktop) en ejecución
- Python 3 y la librería `pika`:

```bash
pip install pika
```

## Pasos

1. Levantar RabbitMQ (con panel de administración en http://localhost:15672, usuario `guest`, clave `guest`):

```bash
docker compose up -d
```

2. En una terminal, iniciar el consumidor (queda esperando mensajes):

```bash
python receive.py
```

3. En otra terminal, enviar mensajes con el productor:

```bash
python send.py
```

El consumidor mostrará ` [x] Received Hello World!`.

4. Ver la cola dentro del contenedor:

```bash
docker exec rabbitmq rabbitmqctl list_queues
```

5. Detener y borrar el contenedor:

```bash
docker compose down
```

## Equivalente sin docker compose

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:4-management
```
