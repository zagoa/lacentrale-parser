# LaCentrale - Parser 
The goal of this repository is to parse the famous website www.lacentrale.fr and extract from it all the cars you want to see in an excel file. 

You can give some parameters like : 
- max price
- max kilometers 
- min year of the car 

By default cars selected are define by the carArray : 
```
const carArray = [
    {brand : "ALFA ROMEO", model: "GIULIETTA"},
    {brand : "BMW", model: "SERIE 1"},
    {brand: "MAZDA", model :"3"},
    {brand: "MERCEDES", model: "CLASSE A"},
    {brand: "VOLKSWAGEN", model: "GOLF"},
    {brand: "AUDI", model: "A1"},
    {brand: "VOLVO", model:"V40"}
]
```

___
## How to run the programme

You need to install [NodeJs](https://nodejs.org/en/).

Then open a terminal and type : `npm install` to install the dependencies.

Then you can run the programme `node index.js`.

And juste follow the instructions in the terminal

___
## How to 

### Add a brand and a model of a car
Open the `index.js` and add a specific line in the carArray, or delete some lines. 

For exemple you can add the RENAULT CLIO like that `{brand: "RENAULT", model: "CLIO"}` and add it to the `carArray`.
```
const carArray = [
    {brand : "ALFA ROMEO", model: "GIULIETTA"},
    ...
    {brand: "RENAULT", model: "CLIO"}
]
```
