def readNumber(msg,rangeStart, rangeEnd):
  while True:
    print(msg)
    str = input()
    if str.isdigit():
      i = int(str)
      if i >= rangeStart and i <= rangeEnd:
        return i
    print("Invalid Input")