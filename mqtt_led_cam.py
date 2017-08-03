import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
from picamera import PiCamera
from time import sleep
import base64
import datetime as dt
import os

pin=8
GPIO.setmode(GPIO.BOARD)
GPIO.setup(pin,GPIO.OUT)


camera = PiCamera()
camera.close()


def convertImageToBase64(image_path):
    with open(image_path,"rb") as image_file:
        encoded = base64.b64encode(image_file.read())
        return encoded

def on_connect(client, userdata, flags, rc):
    print("Connection :", str(rc))

def on_message(client, userdata, message):
    msg = str(message.payload.decode("utf-8"))
    print("message received ", msg)


    if(message.topic == 'home-yavuz/working-room/light-1/state'):
        if(msg == 'on'):
            GPIO.output(pin,1)
        elif(msg == 'off'):
            GPIO.output(pin,0)
    elif(message.topic == 'home-yavuz/working-room/camera'):
        if(msg == 'take'):
            camera = PiCamera()
            camera.resolution = (1024,768)
            camera.vflip = True
            camera.start_preview()
            sleep(1)

	        now = dt.datetime.now().strftime('%Y%m%d%H%M%S')
            imageName = 'camera_images/image_'+now+'.jpg'
            camera.capture(imageName)

            print("Take Photo")  
            camera.stop_preview()
            camera.close()
        
            image_base64 = convertImageToBase64(imageName)
            client.publish("home-yavuz/working-room/camera/photo",image_base64)
            print("Send Photo")

            os.remove(imageName)


address = "165.227.66.242"
print("creating new instance")

client = mqtt.Client("P1")
client.on_connect = on_connect
client.on_message = on_message
print("connecting to broker")

client.connect(address)
#client.loop_start()

client.subscribe("home-yavuz/working-room/light-1/state")
client.subscribe("home-yavuz/working-room/camera")

#time.sleep(4)
client.loop_forever()
