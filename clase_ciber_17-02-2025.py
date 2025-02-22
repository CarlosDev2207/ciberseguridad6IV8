#lo intente en python pero no salio, el chat luego me dijo que en python es asi (no lo probe)

def cifrar_cesar(texto, desplazamiento):
    ABC = "abcdefghijklmnñopqrstuvwxyz"
    texto = texto.lower()  # Convertimos a minúsculas para evitar problemas
    textocodificado = ""

    for c in texto:
        if c in ABC:
            nuevo_index = (ABC.index(c) + desplazamiento) % len(ABC)
            textocodificado += ABC[nuevo_index]
        else:
            textocodificado += c  # Si no está en el alfabeto, lo dejamos igual

    return textocodificado

# Ejemplo de uso
texto_original = "Almita"
desplazamiento = 5
texto_cifrado = cifrar_cesar(texto_original, desplazamiento)
print("Texto cifrado:", texto_cifrado)
