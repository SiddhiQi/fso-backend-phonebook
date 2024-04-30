require("dotenv").config()

const express = require("express")
const app = express()
const Person = require("./models/person")
const cors = require("cors")
const morgan = require("morgan")

app.use(express.static("dist"))
app.use(express.json())
app.use(cors())

morgan.token("data", (request, res) =>
	request.method === "POST" || request.method === "PUT" ? JSON.stringify(request.body) : " "
)
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :data"))

let persons = [
	{
		id: 1,
		name: "Arto Hellas",
		number: "040-123456",
	},
	{
		id: 2,
		name: "Ada Lovelace",
		number: "39-44-5323523",
	},
	{
		id: 3,
		name: "Dan Abramov",
		number: "12-43-234345",
	},
	{
		id: 4,
		name: "Mary Poppendieck",
		number: "39-23-6423122",
	},
]

app.get("/info", (request, response) => {
	Person.countDocuments().then((res) => {
		response.send(`<p>Phonebook has info for ${res} people</p><p>${new Date()}</p>`)
	})
})

app.get("/api/persons", (request, response) => {
	Person.find({}).then((persons) => response.json(persons))
})

app.get("/api/persons/:id", (request, response, next) => {
	const id = Number()
	Person.findById(request.params.id)
		.then((person) => {
			if (person) {
				response.json(person)
			} else {
				response.status(404).end()
			}
		})
		.catch((error) => next(error))
})

app.post("/api/persons/", (request, response) => {
	const body = request.body

	if (!body.name || !body.number) {
		return response.status(400).json({
			error: `name or number information missing`,
		})
	}

	if (persons.find((p) => p.name.toLowerCase() === body.name.toLowerCase())) {
		return response.status(409).json({
			error: "name must be unique",
		})
	}

	const person = new Person(body)

	person.save().then((savedPerson) => {
		response.json(savedPerson)
	})
})

app.put("/api/persons/:id", (request, response, next) => {
	const body = request.body

	const person = {
		name: body.name,
		number: body.number,
	}

	Person.findByIdAndUpdate(request.params.id, person, { new: true })
		.then((updatedPerson) => {
			response.json(updatedPerson)
		})
		.catch((error) => next(error))
})

app.delete("/api/persons/:id", (request, response, next) => {
	Person.findByIdAndDelete(request.params.id)
		.then((result) => {
			response.status(204).end()
		})
		.catch((error) => next(error))
})

const errorHandler = (error, request, response, next) => {
	console.error(error.message)

	if (error.name === "CastError") {
		return response.status(400).send({ error: "malformatted id" })
	}

	next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
