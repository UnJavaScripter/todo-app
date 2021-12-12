#!/usr/bin/python
# -*- coding:utf-8 -*-
import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'lib'))
sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'font'))

fontdir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'font')
fontpath = os.path.join(fontdir, 'Font.ttc')
print("font dir: " + fontdir)
print("font path: " + fontpath)

from PIL import Image, ImageDraw, ImageFont

font15 = ImageFont.truetype(fontpath, 15)
print(font15)
from lib import epd2in13_V2

def _renderItems(index, item, draw):
  if item["display"] == False:
    return
  stateIndicator = u'\u2713' if item["done"] else u'\u2610'
  yOffset = 20 if index == 0 else 20 + (index * 15)
  return draw.text((-4, yOffset), stateIndicator + item["label"], font = font15, fill = 0)

def renderList(todoList):
  try:
      print('init & clear')
      epd = epd2in13_V2.EPD()
      epd.init(epd.FULL_UPDATE)
      epd.Clear(0xFF)

      

      text_image = Image.new('1', (epd.height, epd.width), 255)
      time_draw = ImageDraw.Draw(text_image)
      
      epd.init(epd.FULL_UPDATE)
      # # epd.displayPartBaseImage(epd.getbuffer(time_image))

      time_draw.rectangle((120, 80, 220, 105), fill = 255)
      time_draw.text((0, 0), 'ToDo:', font = font15, fill = 0)
      time_draw.text((0, 7), '-----------------', font = font15, fill = 0)
      for index, todo in enumerate(todoList):
        _renderItems(index, todo, time_draw)

      # #     epd.displayPartial(epd.getbuffer(time_image))

      rotated_image = text_image.rotate(180,  expand=1)
      
      epd.display(epd.getbuffer(rotated_image))
      epd.sleep()
      return True
          
  except IOError as e:
      print(e)
      
  except KeyboardInterrupt:    
      print("ctrl + c:")
      epd2in13_V2.epdconfig.module_exit()
      exit()
