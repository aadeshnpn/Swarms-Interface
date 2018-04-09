#!/bin/bash
i=0
for filename in ./*.JPG;do

  mv $filename $i.jpg

  i=$((i + 1))

done
