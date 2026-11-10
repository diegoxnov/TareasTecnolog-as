#!/usr/bin/env python
"""Producer: envía un mensaje 'Hello World!' a la cola 'hello'."""
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
channel = connection.channel()

# Declarar la cola (si no existe se crea; es idempotente)
channel.queue_declare(queue="hello")

# Publicar en el exchange por defecto (""), usando el nombre de la cola como routing_key
channel.basic_publish(exchange="", routing_key="hello", body="Hello World!")
print(" [x] Sent 'Hello World!'")

connection.close()
