import SwiftUI
import Foundation

struct ContentView: View {
    @State private var email = "isaacmineo@gmail.com"  // Hardcoded email
    @State private var password = "Buddydog41"  // Hardcoded password
    @State private var isLoggedIn = false
    @State private var loginError: String?
    @State private var isLoading = false
    @AppStorage("lastSyncMessage") private var lastSyncMessage: String = "Never synced"
    @AppStorage("hardcodedUserId") private var hardcodedUserId: String = "GME7nGpJQRc2v9T057vJ4oyqAJN2"

    var body: some View {
        VStack(spacing: 20) {
            if isLoggedIn {
                Text("Syncing health data...")
                    .font(.title)
                    .padding()

                Text(lastSyncMessage)
                    .font(.subheadline)
                    .foregroundColor(.gray)

                Button("Re-sync Now") {
                    syncHealthData()
                }
                .padding(.top, 10)
                
                Button("Schedule Background Sync") {
                    scheduleBackgroundSync()
                }
                .padding(.top, 5)

                Button("Logout") {
                    logout()
                }
                .foregroundColor(.red)
                .padding(.top, 5)
            } else {
                ScrollView {
                    VStack(spacing: 15) {
                        Text("Nutrivize Login")
                            .font(.headline)
                        
                        Text("Using hardcoded credentials:")
                            .font(.subheadline)
                        
                        Text("Email: \(email)")
                            .font(.caption)
                        
                        Text("User ID: \(hardcodedUserId)")
                            .font(.caption)
                            .foregroundColor(.gray)

                        if let error = loginError {
                            Text(error)
                                .foregroundColor(.red)
                                .font(.footnote)
                        }

                        Button(action: login) {
                            if isLoading {
                                ProgressView()
                            } else {
                                Text("Login & Sync")
                                    .bold()
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                    .padding()
                }
            }
        }
        .onAppear {
            // Register background task
            BackgroundSyncManager.shared.registerBackgroundTask()
            print("🔄 Background tasks registered on app launch")
            
            // Store hardcoded user ID in UserDefaults
            UserDefaults.standard.set(hardcodedUserId, forKey: "user_id")
            
            // Try to automatically login
            login()
        }
    }

    private func login() {
        isLoading = true
        loginError = nil
        
        print("🔑 Using hardcoded credentials - Email: \(email), User ID: \(hardcodedUserId)")

        NutrivizeAPIClient.shared.login(email: email, password: password) { result in
            DispatchQueue.main.async {
                isLoading = false
                switch result {
                case .success(let auth):
                    isLoggedIn = true
                    print("✅ Login successful. Using hardcoded User ID: \(hardcodedUserId)")
                    HealthDataManager.shared.setUserId(hardcodedUserId)
                    
                    // Save credentials
                    UserDefaults.standard.set(hardcodedUserId, forKey: "user_id")
                    _ = KeychainManager.shared.savePassword(password)
                    
                    syncHealthData()
                    
                    // Schedule background sync
                    scheduleBackgroundSync()
                case .failure(let error):
                    // Try again with mock authentication if regular auth fails
                    print("⚠️ API login failed: \(error.localizedDescription). Using hardcoded user anyway.")
                    isLoggedIn = true
                    HealthDataManager.shared.setUserId(hardcodedUserId)
                    UserDefaults.standard.set(hardcodedUserId, forKey: "user_id")
                    syncHealthData()
                    scheduleBackgroundSync()
                }
            }
        }
    }
    
    private func scheduleBackgroundSync() {
        BackgroundSyncManager.shared.scheduleBackgroundSync()
        print("🕓 Background sync scheduled")
    }

    private func syncHealthData() {
        print("🔄 Starting HealthKit sync with hardcoded User ID: \(hardcodedUserId)...")

        // Ensure the HealthDataManager has the correct user ID
        HealthDataManager.shared.setUserId(hardcodedUserId)

        HealthDataManager.shared.setupHealthKit { success, error in
            if success {
                print("✅ HealthKit setup successful")
                HealthDataManager.shared.fetchLastTenDays { entries in
                    print("📊 Retrieved \(entries.count) days of health data")
                    
                    // Log each entry in detail
                    for (index, entry) in entries.enumerated() {
                        print("📋 Entry \(index + 1):")
                        print("   Date: \(entry.dateKey)")
                        print("   User ID: \(entry.userId)")
                        print("   Steps: \(entry.steps)")
                        print("   Calories: \(entry.calories)")
                        print("   Distance: \(entry.distance) meters")
                        print("   Exercise Minutes: \(entry.exerciseMinutes)")
                        print("   Resting HR: \(entry.restingHeartRate) bpm")
                        print("   Walking HR: \(entry.walkingHeartRate) bpm")
                        print("   Sleep: \(entry.sleepHours) hours")
                    }
                    
                    let encoder = JSONEncoder()
                    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
                    if let jsonData = try? encoder.encode(entries),
                       let jsonString = String(data: jsonData, encoding: .utf8) {
                        print("📤 Full JSON payload being sent to MongoDB:\n\(jsonString)")
                    } else {
                        print("⚠️ Failed to encode HealthKit entries")
                    }

                    NutrivizeAPIClient.shared.uploadHealthKitData(entries: entries) { result in
                        DispatchQueue.main.async {
                            switch result {
                            case .success(let response):
                                let formatter = DateFormatter()
                                formatter.dateStyle = .medium
                                formatter.timeStyle = .short
                                lastSyncMessage = "Last synced: \(formatter.string(from: Date())) (\(response.results.count) days)"
                                print("✅ Uploaded \(response.results.count) days of health data to MongoDB")
                                print("📊 Success count: \(response.results.count)")
                                print("📊 Error count: \(response.errors?.count ?? 0)")
                                
                                // Log details of successful uploads
                                for result in response.results {
                                    print("✓ Successfully uploaded entry for \(result.dateKey) (ID: \(result.id))")
                                }
                                
                                // Log any errors
                                if let errors = response.errors, !errors.isEmpty {
                                    print("⚠️ Some entries failed to upload:")
                                    for error in errors {
                                        print("  ❌ Entry \(error.index): \(error.error)")
                                    }
                                }
                                
                                // Schedule background sync for future updates
                                scheduleBackgroundSync()
                            case .failure(let error):
                                lastSyncMessage = "Sync failed: \(error.localizedDescription)"
                                print("❌ Sync error: \(error.localizedDescription)")
                            }
                        }
                    }
                }
            } else {
                DispatchQueue.main.async {
                    lastSyncMessage = "HealthKit not authorized"
                    print("❌ HealthKit authorization failed: \(error?.localizedDescription ?? "Unknown error")")
                }
            }
        }
    }

    private func logout() {
        NutrivizeAPIClient.shared.clearTokenFromKeychain()
        UserDefaults.standard.removeObject(forKey: "user_id")
        KeychainManager.shared.deletePassword()
        isLoggedIn = false
        lastSyncMessage = "Never synced"
        print("🧹 Logged out and cleared token")
        
        // Auto-login again after logout since we're using hardcoded credentials
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            login()
        }
    }
}
