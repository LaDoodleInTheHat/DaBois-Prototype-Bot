 # Number & Text Analyzer 

#  Example Input: 23 apple 5 17 banana 23 Level 42 racecar 5

# Integers (unique): [23, 5, 17, 42]
#   • Sum: 87
#   • Average: 21.75
#   • Primes: [23, 5, 17]
#   • Perfect squares: [49? none if none]

# Words (unique): ['apple', 'banana', 'Level', 'racecar']
#   • Total words: 4
#   • Longest: 'racecar'
#   • Shortest: 'apple'
#   • Palindromes: ['Level', 'racecar']

# ask user to give you a word and check if it is a palindrome 

import math

words= []
ints = []

seen_words = []
seen_ints = []

userInput = input("Put A list of integers and words, formatted like this - '1 2 hello 3 world': ")

unputs = userInput.split(" ")

for singularInputOfTerraria in unputs:
    if singularInputOfTerraria.isdigit():
        ints.append(int(singularInputOfTerraria))
    else:
        words.append(singularInputOfTerraria)

for word in words : 
    if word not in seen_words:
        seen_words.append(word)

for integer in ints:
    if integer not in seen_ints:
        seen_ints.append(integer)

words = seen_words
ints = seen_ints

sum = 0
for x in ints:
    sum += x

sqrts = []
for squirt in ints:
    root = math.sqrt(squirt)
    if root*root == squirt:
        sqrts.append(squirt)

print(f"Words (unique): {words}") #Words (unique): ['apple', 'banana', 'Level', 'racecar']
print(f"    - Total Words: {len(words)}")#• Total words: 4
print(f"    - Palindromes: {[word for word in words if  word ==  word[::-1] ]}")

print(f"\nIntegers (unique): {ints}")#Integers (unique): [23, 5, 17, 42]
print(f"    - Sum: {sum}")
print(f"    - Average: {round((sum/len(ints)), 2)}")   #• Average: 21.75
print(f"    - Perfect squares: {sqrts}")                  # • Perfect squares: [49? none if none]

