import {
  StyleSheet,
  Image,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import Colors from "./../constants/Colors";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const router = useRouter();
  return (
    <LinearGradient
      colors={["#f3e7fa", "#e3e0ff"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Image
          source={require("./../assets/images/landing.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>MINDHAVEN</Text>
        <Text style={styles.tagline}>Empowering your mental wellness journey</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("./signup")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.footerText}>© {new Date().getFullYear()} MindHaven. All rights reserved.</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 48,
    lineHeight: 62,
    color: Colors.FONTCOLOR,
    textAlign: "center",
    marginVertical: 10,
    fontFamily: "NotoSans",
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 18,
    color: '#6c4ab6',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  button: {
    padding: 18,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 50,
    width: "85%",
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.WHITE,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: '#b3a6d9',
    fontSize: 13,
    textAlign: 'center',
  },
});
