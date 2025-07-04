import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import AuthScreenWrapper from "../components/AuthScreenWrapper";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../utils/UserContext";

const API_URL = "http://108.181.218.68:8000/api/add_user/";

const CreateNewAccount = async (name, email, password, router, fetchUserProfile) => {
  if (!name || !email || !password) {
    Alert.alert("Error", "All fields are required");
    return;
  }

  const SaveUser = async (name, email, password) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        return {
          success: true,
          message: data.message || "User created successfully",
          user_id: data.user_id,
        };
      } else {
        return { success: false, message: data.error || "Signup failed" };
      }
    } catch (error) {
      return { success: false, message: "Something went wrong. Try again." };
    }
  };

  const result = await SaveUser(name, email, password);

  if (result.success) {
    if (result.user_id) {
      await AsyncStorage.setItem("user_id", result.user_id);
      await fetchUserProfile();
    }
    Alert.alert("Success", "Account created successfully");
    router.push("/home");
  } else {
    Alert.alert("Signup Failed", result.message);
  }
};

const SignUpScreen = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { fetchUserProfile } = useUser();

  const handleSignUp = () => {
    CreateNewAccount(name, email, password, router, fetchUserProfile);
  };

  return (
    <AuthScreenWrapper>
      <AuthInput placeholder="Full Name" value={name} onChangeText={setName} />
      <AuthInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <AuthInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <AuthButton title="Sign Up" onPress={handleSignUp} />

      <TouchableOpacity
        onPress={() => router.push("/login")}
        style={styles.loginContainer}
      >
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Login</Text>
        </Text>
      </TouchableOpacity>
    </AuthScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    fontSize: 16,
    color: "#333",
  },
  loginLink: {
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default SignUpScreen;
