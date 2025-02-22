import java.util.Scanner;
public class claseCiber1
{
public static void main(String [] args){
    
    Scanner scanner = new Scanner(System.in);


        String ABC = "abcdefghijklmnñopqrstuvwxyz";
        int pos = 5; 

        System.out.print("Ingresa el texto a cifrar: ");
        String textoOriginal = scanner.nextLine().toLowerCase();

        // Cifrar
        String textoCifrado = cifrar(textoOriginal, ABC, pos);
        System.out.println("Texto cifrado: " + textoCifrado);

        // Descifrar
        String textoDescifrado = descifrar(textoCifrado, ABC, pos);
        System.out.println("Texto descifrado: " + textoDescifrado);

        scanner.close();
    }

    // Método para cifrar
    public static String cifrar(String texto, String ABC, int desplazamiento) {
        String resultado = "";
        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            int index = ABC.indexOf(c);

            if (index == -1) {
                resultado += c; // Si no está en ABC, lo deja igual :U
            } else {
                resultado += ABC.charAt((index + desplazamiento) % ABC.length());
            }
        }
        return resultado;
    }

    // Método para descifrar
    public static String descifrar(String texto, String ABC, int desplazamiento) {
        String resultado = "";
        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            int index = ABC.indexOf(c);

            if (index == -1) {
                resultado += c; // Si no está en ABC, lo deja igual
            } else {
                resultado += ABC.charAt((index - desplazamiento + ABC.length()) % ABC.length());
            }
        }
        return resultado;
}
}