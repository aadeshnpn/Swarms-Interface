#!/bin/bash
while IFS='' read -r line || [[ -n "$line" ]]; do
	git cat-file -p $line>$line.txt
done < "$1"
