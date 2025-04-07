/* alert("hola")

localStorage.setItem('Darkmode', false)

//obtener el valor de esas variables
const valor = localStorage.getItem('Darkmode')
console.log('El valor es: ' + valor)

//localStorage.removeItem('Darkmode')

const Namekey = 'name'

sessionStorage.setItem(Namekey, 'Almita')

const valor1 = sessionStorage.getItem(Namekey)
console.log('El valor es: ' + valor1)

//Eliminar la sessionStorage

sessionStorage.removeItem(Namekey)
*/
const person = {
    name: 'Juan',
    age: 22
}

const ssPersonKey = "person"
sessionStorage.setItem(ssPersonKey, JSON.stringify(person))
const ssPerson = JSON.parse(sessionStorage.getItem(ssPersonKey))

console.log(ssPerson.name)
console.log(ssPerson.age)


//lista blanca o caja blanca