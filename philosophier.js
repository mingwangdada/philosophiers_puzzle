class Character {
	constructor(character, shift, capital) {
		this.character = character
		this.shift = shift??"⍰"
		this.capital = capital??character
	}
	isEqualTo(character) {
		return (this.character === character.character && this.shift === character.shift && this.capital === character.capital)
	}
}
class Keyboard {
	pattern = []
	name = ""
	startX = 0
	startY = 0
	constructor(sizeX, sizeY, name, startX, startY) {
		if (sizeX < 0 || sizeY < 0 || typeof name !== "string") {
			throw new Error("Unexpected parameter!")
		}
		this.startX = startX
		this.startY = startY
		this.name = name
		for (let x = 0; x < sizeX; x++) {
			this.pattern[x] = []
			for (let y = 0; y < sizeY; y++) {
				this.pattern[x][y] = new Character("⍰")
			}
		}
	}
	replaceCharacter(character, posX, posY) {
		this.pattern[posX][posY] = character
	}
	returnKeyboradChar(str) {
		if (str === "[Capital Lock]") str = '"C"';
		if (str === "[Shift]") str = '"↑"';
		if (str === "[Alternate]") str = '"alt"';
		if (str === "[Control]") str = '"ctrl"';
		if (str === "[Function]") str = '"fn"';
		if (str === "\t") str = '"tab"';
		if (str === " ") str = '"S"';
		if (str === "\n") str = '"E"';
		let output = [new Character("⍰"), -1, -1, -1]
		for (let x = 0; x < this.pattern.length; x++) {
			for (let y = 0; y < this.pattern[x].length; y++) {
				if (this.pattern[x][y].character === str) {
					output = [this.pattern[x][y], x, y, 0]
					return output 
				}
				if (this.pattern[x][y].capital === str) {
					output = [this.pattern[x][y], x, y, 2]
					return output
				}
				if (this.pattern[x][y].shift === str) {
					output = [this.pattern[x][y], x, y, 1]
					return output
				}
			}
		}
		return output
	}
	insertCharacters(charArray) {
		let succeedCount = 0
		for (let charWithPos of charArray) {
			let character = charWithPos[0]
			let posX = charWithPos[1]
			let posY = charWithPos[2]
			if (this.pattern[posX][posY].character === "⍰" && this.pattern[posX][posY].shift === "⍰" && this.pattern[posX][posY].capital === "⍰") {
				this.pattern[posX][posY] = character
				succeedCount++
			}
		}
		return succeedCount
	}
	getOffset(parts, index) {
		let dx = 0
		let dy = 0
		const directs = parts[index].replace(/"[↑↓←→]"/, "").match(/[↑↓←→][^↑↓←→]*/g)
		const directors = parts[index].match(/[↑↓←→]\d{1,}/g)
		if (!(parts[index].slice(((parts[index].match(/^"[^"]*"/)??[""])[0].length)) === "——")) {
			for (let direct of directs) {
				const dir = direct[0]
				let num = Number(direct.slice(1))
				if (directors.filter(d => d.startsWith("↑") || d.startsWith("↓")).length > 1 || directors.filter(d => d.startsWith("←") || d.startsWith("→")).length > 1) {
					throw new Error("Too many directors!")
				}
				switch (dir) {
					case "↑":
						dx -= num
					break
					case "↓":
						dx += num
					break
					case "←":
						dy -= num
					break
					case "→":
						dy += num
					break
				}
			}
		}
		return {dx, dy}
	}
	decode(sequence) {
		if (!sequence || sequence.trim() === "") return "";
		const parts = sequence.split("*")
		parts.length = parts.length - 1
		let output = []
		let currentX = this.startX
		let currentY = this.startY
		let isFunction = false
		let lastFunctionIndex = -2
		function endFunction(index) {
			isFunction = false
			if (lastFunctionIndex === index - 1) {
				output.pop()
				output.push("[Function]")
			}
		}
		for (let i = 0; i < parts.length; i++) {
			let part = parts[i]
			try {
				const detectedQuote = part.match(/^"[^"]*"/)
				if (detectedQuote) {
					const quoted = detectedQuote[0].slice(1, -1)
					if (part === detectedQuote[0]) {
						if (isFunction) {
							endFunction(i)
							if (quoted === "S") {
								output.push("")
								continue
							}
						}
						if (quoted === "←") {
							if (output.length > 0) {
								output.pop()
							}
							continue;
						}
						if (quoted === "C") {
							output.push("[Capital Lock]")
							continue;
						}
						if (quoted === "S") {
							output.push(" ")
							continue;
						}
						if (quoted === "tab") {
							output.push("\t")
							continue;
						}
						if (quoted === "E") {
							output.push("\n")
							continue;
						}
						if (quoted === "↑") {
							output.push("[Shift]")
							continue;
						}
						if (quoted === "ctrl") {
							output.push("[Control]")
							continue;
						}
						if (quoted === "alt") {
							output.push("[Alternate]")
							continue;
						}
						if (quoted === "fn") {
							if (i === parts.length - 1) {
								output.push("[Function]")
								continue
							}
							output.push(" F")
							isFunction = true
							lastFunctionIndex = i
							continue;
						}
						output.push(quoted)
						continue;
					} else {
						let character = ""
						let offset = this.getOffset(parts, i)
						if (quoted === "←") {
							let preOffset = this.getOffset(parts, i - 1)
							currentX = currentX - preOffset.dx + offset.dx
							currentY = currentY - preOffset.dy + offset.dy
							character = this.pattern[currentX][currentY].character
						} else {
							currentX = currentX + offset.dx
							currentY = currentY + offset.dy
							if (quoted === "C") {
								character = this.pattern[currentX][currentY].capital
							} else if (quoted === "↑") {
								character = this.pattern[currentX][currentY].shift
							} else {
								throw new Error("Invalid mixed input!")
							}
						}
						if (character === '"C"') {
							character = "[Capital Lock]"
						}
						if (character === '"S"') {
							character = " "
						}
						if (character === '"tab"') {
							character = "\t"
						}
						if (character === '"E"') {
							character = "\n"
						}
						if (character === '"↑"') {
							character = "[Shift]"
						}
						if (character === '"ctrl"') {
							character = "[Control]"
						}
						if (character === '"alt"') {
							character = "[Alternate]"
						}
						if (isFunction) {
							if (character.match(/\d/)) {
								if (output[output.length - 1].endsWith(" ")) {
									output.push(output.pop().slice(0, -1))
								}
								output.push(character + " ")
							} else {
								endFunction(i)
								if (character === '"fn"') {
									if (i === parts.length - 1) {
										output.push("[Function]")
										continue
									}
									output.push(" F")
									isFunction = true
									lastFunctionIndex = i
								} else {
									if (character === " ") {
										character = ""
									}
									output.push(character)
								}
							}
						} else {
							if (character === '"fn"') {
								if (i === parts.length - 1) {
									output.push("[Function]")
									continue
								}
								output.push(" F")
								isFunction = true
								lastFunctionIndex = i
							} else {
								output.push(character)
							}
						}
					}
				} else {
					let offset = this.getOffset(parts, i)
					currentX = currentX + offset.dx
					currentY = currentY + offset.dy
					let character = this.pattern[currentX][currentY].character
					if (character === '"C"') {
						character = "[Capital Lock]"
					}
					if (character === '"S"') {
						character = " "
					}
					if (character === '"tab"') {
						character = "\t"
					}
					if (character === '"E"') {
						character = "\n"
					}
					if (character === '"↑"') {
						character = "[Shift]"
					}
					if (character === '"ctrl"') {
						character = "[Control]"
					}
					if (character === '"alt"') {
						character = "[Alternate]"
					}
					if (isFunction) {
						if (character.match(/\d/)) {
							if (output[output.length - 1].endsWith(" ")) {
								output.push(output.pop().slice(0, -1))
							}
							output.push(character + " ")
						} else {
							endFunction(i)
							if (quoted === "S") {
								output.push("")
								continue
							}
							if (character === '"fn"') {
								if (i === parts.length - 1) {
									output.push("[Function]")
									continue
								}
								output.push(" F")
								isFunction = true
								lastFunctionIndex = i
							} else {
								if (character === " ") {
									character = ""
								}
								output.push(character)
							}
						}
					} else {
						if (character === '"fn"') {
							if (i === parts.length - 1) {
								output.push("[Function]")
								continue
							}
							output.push(" F")
							isFunction = true
							lastFunctionIndex = i
						} else {
							output.push(character)
						}
					}
				}
			} catch (e) {
				console.log(e)
				if (isFunction) {
					endFunction(i)
				}
				output.push("⍰")
			}
		}
		return output.join("")
	}
	encode(line) {
		let output = ""
		let skip = 0
		let currentX = this.startX
		let currentY = this.startY
		for (let i = 0; i < line.length; i++) {
			let character = line[i]
			if (skip > 0) {
				skip = skip - 1
				continue
			}
			if (character === "[") {
				if (line.slice(i, i + 14) === "[Capital Lock]") {
					output = output + '"C"*'
					skip = 13
					continue
				} else if (line.slice(i, i + 7) === "[Shift]") {
					output = output + '"↑"*'
					skip = 6
					continue
				} else if (line.slice(i, i + 9) === "[Control]") {
					output = output + '"ctrl"*'
					skip = 8
					continue
				} else if (line.slice(i, i + 11) === "[Alternate]") {
					output = output + '"alt"*'
					skip = 10
					continue
				} else if (line.slice(i, i + 10) === "[Function]") {
					output = output + '"fn"*'
					skip = 9
					continue
				}
			}
			if (character === " ") {
				output = output + '"S"*'
				continue
			}
			if (character === "\n") {
				output = output + '"E"*'
				continue
			}
			if (character === "\t") {
				output = output + '"tab"*'
				continue
			}
			let keyboardChar = this.returnKeyboradChar(character)
			if (keyboardChar[3] === -1) {
				output = output + `"${character}"*`
			} else {
				let mixedInput = ""
				let dx = keyboardChar[1] - currentX
				let dy = keyboardChar[2] - currentY
				let direct = `${dx === 0? "": dx > 0? "↓" + dx: "↑" + (-dx)}${dy === 0? "": dy > 0? "→" + dy: "←" + (-dy)}`
				if (direct === "") {
					direct = "——"
				}
				if (keyboardChar[3] === 1) {
					mixedInput = '"↑"'
				}
				if (keyboardChar[3] === 2) {
					mixedInput = '"C"'
				}
				currentX = keyboardChar[1]
				currentY = keyboardChar[2]
				output = output + mixedInput + direct + "*"
			}
			
		}
		return output
	}
}
class CompoundKeyboard extends Keyboard {
	characterSet = []
	validInputs = []
	constructor (sizeX, sizeY, name, startX, startY) {
		super(sizeX, sizeY, name, startX, startY)
	}
	addCharSet(charSetArray) {
		let succeedCount = 0
		for (let charSet of charSetArray) {
			if (!this.characterSet.some(s => s.pattern === charSet[1])) {
				for (let i = 0; i < charSet[1].length; i++) {
					if (!this.isValidInput(this.returnKeyboradChar(charSet[1][i])[0])) {
						console.warn(`An invalid input detected. This character '${charSet[0]}' may never be used!`)
					}
				}
				this.characterSet.push({character: charSet[0], pattern: charSet[1]})
				succeedCount++
			}
		}
		return succeedCount
	}
	isValidInput(character) {
		if (!(character instanceof Character)) {
			throw new Error("Not a Character!")
		}
		return this.validInputs.some(input => character.isEqualTo(input))
	}
	addValidInput(validInputs) {
		let succeedCount = 0
		for (let validInput of validInputs) {
			if (this.isValidInput(validInput)) {
				continue
			}
			this.validInputs.push(validInput)
			succeedCount++
		}
		return succeedCount
	}
	decode(sequence) {
		let characterSet = this.characterSet
		if (!sequence || sequence.trim() === "") return "";
		const inputs = sequence.split("*")
		inputs.length = inputs.length -	1
		let output = []
		let currentX = this.startX
		let currentY = this.startY
		let isCompound = false
		let isFunction = false
		let lastCompoundIndex = -2
		let lastFunctionIndex = -2
		function endCompound(index) {
			isCompound = false
			if (lastCompoundIndex === index - 1) return;
			let compoundPattern = ""
			let popCount = 0
			for (let i = lastCompoundIndex; i < index; i++) {
				compoundPattern = compoundPattern + output[i]
				popCount++
			}
			let find = characterSet.find(s => s.pattern === compoundPattern)
			if (find) {
				for (let i = lastCompoundIndex; i < lastCompoundIndex + popCount; i++) {
					output[i] = ""
				}
				output.pop()
				output.push(find.character)
			}
		}
		function endFunction(index) {
			isFunction = false
			if (lastFunctionIndex === index - 1) {
				output.pop()
				output.push("[Function]")
			}
		}
		for (let i = 0; i < inputs.length; i++) {
			let input = inputs[i]
			try {
				const detectedQuote = input.match(/^"[^"]*"/)
				if (detectedQuote) {
					if (isCompound) {
						if (input === '"S"') {
							output.push("")
							endCompound(i)
							continue
						}
						endCompound(i)
					}
					const quoted = detectedQuote[0].slice(1, -1)
					if (input === detectedQuote[0]) {
						if (isFunction) {
							endFunction(i)
							if (quoted === "S") {
								output.push("")
								continue
							}
						}
						if (quoted === "←") {
							if (output.length > 0) {
								output.pop()
								output.push("", "")
								continue
							}
						}
						if (quoted === "C") {
							output.push("[Capital Lock]")
							continue
						}
						if (quoted === "S") {
							output.push(" ")
							continue
						}
						if (quoted === "tab") {
							output.push("\t")
							continue
						}
						if (quoted === "E") {
							output.push("\n")
							continue
						}
						if (quoted === "↑") {
							output.push("[Shift]")
							continue
						}
						if (quoted === "ctrl") {
							output.push("[Control]")
							continue
						}
						if (quoted === "fn") {
							if (i === inputs.length - 1) {
								output.push("[Function]")
								continue;
							}
							output.push(" F")
							isFunction = true
							lastFunctionIndex = i
							continue;
						}
						output.push(quoted)
						continue
					} else {
						let character = ""
						let offset = this.getOffset(inputs, i)
						if (quoted === "←") {
							let preOffset = this.getOffset(inputs, i - 1)
							currentX = currentX - preOffset.dx + offset.dx
							currentY = currentY - preOffset.dy + offset.dy
							character = this.pattern[currentX][currentY].character
						} else {
							currentX = currentX + offset.dx
							currentY = currentY + offset.dy
							if (quoted === "C") {
								character = this.pattern[currentX][currentY].capital
							} else if (quoted === "↑") {
								character = this.pattern[currentX][currentY].shift
							} else {
								throw new Error("Invalid mixed input!")
							}
						}
						if (character === '"C"') {
							character = "[Capital Lock]"
						}
						if (character === '"S"') {
							character = " "
						}
						if (character === '"tab"') {
							character = "\t"
						}
						if (character === '"E"') {
							character = "\n"
						}
						if (character === '"↑"') {
							character = "[Shift]"
						}
						if (character === '"ctrl"') {
							character = "[Control]"
						}
						if (character === '"alt"') {
							character = "[Alternate]"
						}
						if (isFunction) {
							if (character.match(/\d/)) {
								if (output[output.length - 1].endsWith(" ")) {
									output.push(output.pop().slice(0, -1))
								}
								output.push(character + " ")
							} else {
								endFunction(i)
								if (character === '"fn"') {
									if (i === inputs.length - 1) {
										output.push("[Function]")
										continue
									}
									output.push(" F")
									isFunction = true
									lastFunctionIndex = i
								} else {
									if (character === " ") {
										character = ""
									}
									output.push(character)
								}
							}
						} else {
							if (character === '"fn"') {
								if (i === inputs.length - 1) {
									output.push("[Function]")
									continue;
								}
								output.push(" F")
								isFunction = true
								lastFunctionIndex = i
							} else {
								output.push(character)
							}
						}
					}
				} else {
					let offset = this.getOffset(inputs, i)
					currentX = currentX + offset.dx
					currentY = currentY + offset.dy
					let character = this.pattern[currentX][currentY].character
					if (character === '"C"') {
						character = "[Capital Lock]"
					}
					if (character === '"S"') {
						character = " "
					}
					if (character === '"tab"') {
						character = "\t"
					}
					if (character === '"E"') {
						character = "\n"
					}
					if (character === '"↑"') {
						character = "[Shift]"
					}
					if (character === '"ctrl"') {
						character = "[Control]"
					}
					if (character === '"alt"') {
						character = "[Alternate]"
					}
					if (isFunction) {
						if (character.match(/\d/)) {
							if (output[output.length - 1].endsWith(" ")) {
								output.push(output.pop().slice(0, -1))
							}
							output.push(character + " ")
						} else {
							endFunction(i)
							if (quoted === "S") {
								output.push("")
								continue
							}
							if (character === '"fn"') {
								if (i === inputs.length - 1) {
									output.push("[Function]")
									continue
								}
								output.push(" F")
								isFunction = true
								lastFunctionIndex = i
							} else {
								if (character === " ") {
									character = ""
								}
								output.push(character)
							}
						}
					} else {
						if (character === '"fn"') {
							if (isCompound) {
								endCompound(i)
							}
							if (i === inputs.length - 1) {
								output.push("[Function]")
								continue;
							}
							output.push(" F")
							isFunction = true
							lastFunctionIndex = i
							continue
						}
						if (character === " " && isCompound) {
							endCompound(i)
							output.push("")
							continue
						}
						if (this.isValidInput(this.returnKeyboradChar(character)[0])) {
							if (!isCompound) {
								isCompound = true
								lastCompoundIndex = i
							}
							output.push(character)
							if (isCompound && i === inputs.length - 1) {
								endCompound(i + 1)
							}
						} else {
							if (isCompound) {
								endCompound(i)
							}
						}
					}
				}
			} catch (e) {
				console.log(e)
				if (isFunction) {
					endFunction(i)
				}
				if (isCompound) {
					endCompound(i)
				}
				output.push("⍰")
			}
		}
		return output.join("")
	}
	solvePattern(line) {
		let output = ""
		const inputs = line.slice("")
		let characters = this.characterSet.map(s => s.character)
		for (let i = 0; i < inputs.length; i++) {
			let input = inputs[i]
			if (characters.includes(input)) {
				output = output + this.characterSet[characters.indexOf(input)].pattern + " "
			} else {
				if (this.returnKeyboradChar(input)[3] === 0) {
					if (i > 0) {
						if (this.returnKeyboradChar(inputs[i - 1])[3] === 0) {
							output = output.slice(0, -1)
						}
					}
					output = output + input + " "
					continue
				}
				output = output	+ input
			}
		}
		return output
	}
}
const defaultKeyboardChars = [
	[new Character("`", "~"), 0, 0],
	[new Character("1", "!"), 0, 1],
	[new Character("2", "@"), 0, 2],
	[new Character("3", "#"), 0, 3],
	[new Character("4", "$"), 0, 4],
	[new Character("5", "%"), 0, 5],
	[new Character("6", "^"), 0, 6],
	[new Character("7", "&"), 0, 7],
	[new Character("8", "*"), 0, 8],
	[new Character("9", "("), 0, 9],
	[new Character("0", ")"), 0, 10],
	[new Character("-", "_"), 0, 11],
	[new Character("=", "+"), 0, 12],
	[new Character('"←"'), 0, 13],
	[new Character('"tab"'), 1, 0],
	[new Character("q", "Q", "Q"), 1, 1],
	[new Character("w", "W", "W"), 1, 2],
    [new Character("e", "E", "E"), 1, 3],
    [new Character("r", "R", "R"), 1, 4],
    [new Character("t", "T", "T"), 1, 5],
    [new Character("y", "Y", "Y"), 1, 6],
    [new Character("u", "U", "U"), 1, 7],
    [new Character("i", "I", "I"), 1, 8],
    [new Character("o", "O", "O"), 1, 9],
    [new Character("p", "P", "P"), 1, 10],
    [new Character("[" , "{"), 1, 11],
    [new Character("]" , "}"), 1, 12],
    [new Character("\\", "|"), 1, 13],
	[new Character('"C"'), 2, 0],
    [new Character("a", "A", "A"), 2, 1],
    [new Character("s", "S", "S"), 2, 2],
    [new Character("d", "D", "D"), 2, 3],
    [new Character("f", "F", "F"), 2, 4],
    [new Character("g", "G", "G"), 2, 5],
    [new Character("h", "H", "H"), 2, 6],
    [new Character("j", "J", "J"), 2, 7],
    [new Character("k", "K", "K"), 2, 8],
    [new Character("l", "L", "L"), 2, 9],
    [new Character(";", ":"), 2, 10],
    [new Character("'", '"'), 2, 11],
    [new Character("↑"), 2, 12],
    [new Character('"E"'), 2, 13],
	[new Character('"↑"'), 3, 0],
	[new Character("z", "Z", "Z"), 3, 1],
    [new Character("x", "X", "X"), 3, 2],
    [new Character("c", "C", "C"), 3, 3],
    [new Character("v", "V", "V"), 3, 4],
    [new Character("b", "B", "B"), 3, 5],
    [new Character("n", "N", "N"), 3, 6],
    [new Character("m", "M", "M"), 3, 7],
    [new Character(",", "<"), 3, 8],
    [new Character(".", ">"), 3, 9],
    [new Character("/", "?"), 3, 10],
    [new Character("←"), 3, 11],
    [new Character("↓"), 3, 12],
    [new Character("→"), 3, 13],
    [new Character('"ctrl"'), 4, 0],
	[new Character('"fn"'), 4, 1],
	[new Character('"fn"'), 4, 2],
	[new Character('"alt"'), 4, 3],
	[new Character('"alt"'), 4, 4],
	[new Character('"S"'), 4, 5],
	[new Character('"S"'), 4, 6],
	[new Character('"S"'), 4, 7],
	[new Character('"S"'), 4, 8],
	[new Character('"S"'), 4, 9],
	[new Character('"S"'), 4, 10]
]
const defaultKeyboard = new Keyboard(5, 14, "26En", 1, 1)
defaultKeyboard.insertCharacters(defaultKeyboardChars)
const letters = [new Character("q", "Q", "Q"),
	new Character("w", "W", "W"),
    new Character("e", "E", "E"),
    new Character("r", "R", "R"),
    new Character("t", "T", "T"),
    new Character("y", "Y", "Y"),
    new Character("u", "U", "U"),
    new Character("i", "I", "I"),
    new Character("o", "O", "O"),
    new Character("p", "P", "P"),
    new Character("a", "A", "A"),
    new Character("s", "S", "S"),
    new Character("d", "D", "D"),
    new Character("f", "F", "F"),
    new Character("g", "G", "G"),
    new Character("h", "H", "H"),
    new Character("j", "J", "J"),
    new Character("k", "K", "K"),
    new Character("l", "L", "L"),
	new Character("z", "Z", "Z"),
    new Character("x", "X", "X"),
    new Character("c", "C", "C"),
    new Character("v", "V", "V"),
    new Character("b", "B", "B"),
    new Character("n", "N", "N"),
    new Character("m", "M", "M")
]
const UTF = [
	new Character("\\"),
	new Character("u"),
	new Character("0"),
	new Character("1"),
	new Character("2"),
	new Character("3"),
	new Character("4"),
	new Character("5"),
	new Character("6"),
	new Character("7"),
	new Character("8"),
	new Character("9"),
	new Character("A"),
	new Character("B"),
	new Character("C"),
	new Character("D"),
	new Character("E"),
	new Character("F")
]
const UTFChars = [
	[new Character("\\"), 0, 0],
	[new Character("u"), 1, 0],
	[new Character("0"), 2, 0],
	[new Character("1"), 0, 1],
	[new Character("2"), 0, 2],
	[new Character("3"), 0, 3],
	[new Character("4"), 1, 1],
	[new Character("5"), 1, 2],
	[new Character("6"), 1, 3],
	[new Character("7"), 2, 1],
	[new Character("8"), 2, 2],
	[new Character("9"), 2, 3],
	[new Character("A"), 0, 4],
	[new Character("B"), 1, 4],
	[new Character("C"), 2, 4],
	[new Character("D"), 0, 5],
	[new Character("E"), 1, 5],
	[new Character("F"), 2, 5]
]
const testCharSet = []
for (let i = 0x0000; i <= 0xffff; i++) {
  const char = String.fromCharCode(i);
  const escapeSeq = "\\u" + i.toString(16).toUpperCase().padStart(4, '0');
  testCharSet.push([char, escapeSeq]);
}
const testCompKeyboard = new CompoundKeyboard(3, 6, "Test0", 0, 1)
testCompKeyboard.addValidInput(UTF)
testCompKeyboard.insertCharacters(UTFChars)
testCompKeyboard.addCharSet(testCharSet)
const keyboards = [defaultKeyboard, testCompKeyboard]
const keyboardNames = keyboards.map(k => k.name)
function decoder(sequence) {
	let head = sequence.split("*")[0]
	let keyboard = defaultKeyboard
	let control = head.match(/^"[^"]*"/)??[""]
	let name = control[0].slice(1, -1)
	let subsequence = sequence
	if (keyboardNames.includes(name)) {
		keyboard = keyboards[keyboardNames.indexOf(name)]
		subsequence = sequence.slice(control[0].length)
		head = head.slice(control[0].length)
	}
	if (keyboard.decode(head + "*") === "⍰") {
		subsequence = subsequence.slice(head.length + 1)
		let mixedInput = (head.match(/^"[^"]*"/)??[""])[0]
		let headChar = keyboard.returnKeyboradChar(head.slice(mixedInput.length))
		if (headChar[3] > -1 && headChar[3] < 3) {
			subsequence = mixedInput + keyboard.encode(headChar[0].character) + subsequence
		} else {
			return "⍰" + keyboard.decode(subsequence)
		}
	}
	return keyboard.decode(subsequence)
}
function encoder(line, keyboardName = "26En") {
	if (!keyboardNames.includes(keyboardName)) {
		throw new Error(`Cannot find keyboard ${keyboardName}.`)
	}
	let keyboard = keyboards[keyboardNames.indexOf(keyboardName)]
	let output = keyboard instanceof CompoundKeyboard? keyboard.encode(keyboard.solvePattern(line)): keyboard.encode(line)
	if (keyboardName !== defaultKeyboard.name) {
		output = `"${keyboardName}"${output}`
	}
	return output
}
