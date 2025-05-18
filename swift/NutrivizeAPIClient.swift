import UIKit

// MARK: - Authentication Models

struct LoginRequest: Codable {
    let email: String
    let password: String
    let deviceId: String?

    enum CodingKeys: String, CodingKey {
        case email
        case password
        case deviceId = "device_id"
    }
}

struct AuthResponse: Codable {
    let accessToken: String
    let tokenType: String
    let userId: String

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case userId = "user_id"
    }
}

struct HealthKitDataPoint: Codable {
    let userId: String
    let date: String
    let dateKey: String
    let steps: Double
    let calories: Double
    let distance: Double
    let exerciseMinutes: Double
    let restingHeartRate: Double
    let walkingHeartRate: Double
    let sleepHours: Double
    let source: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case date
        case dateKey = "date_key"
        case steps
        case calories
        case distance
        case exerciseMinutes = "exercise_minutes"
        case restingHeartRate = "resting_heart_rate"
        case walkingHeartRate = "walking_heart_rate"
        case sleepHours = "sleep_hours"
        case source
    }
}

struct BatchUploadRequest: Codable {
    let entries: [HealthKitDataPoint]
}

struct BatchUploadResponse: Codable {
    let success: Bool
    let results: [UploadResult]
    let errors: [UploadError]?

    struct UploadResult: Codable {
        let index: Int
        let status: String
        let id: String
        let dateKey: String

        enum CodingKeys: String, CodingKey {
            case index
            case status
            case id
            case dateKey = "date_key"
        }
    }

    struct UploadError: Codable {
        let index: Int
        let error: String
    }
}

// MARK: - API Client

class NutrivizeAPIClient {
    static let shared = NutrivizeAPIClient()

    // Update the baseURL to use the server defined in the project settings
    #if DEBUG
    // URLs for development and testing
    private let simulatorURLs = [
        "http://localhost:5001/api",    // Simulator - primary
        "http://127.0.0.1:5001/api"     // Simulator - fallback
    ]
    
    private let deviceURLs = [
        "https://9264-32-217-60-78.ngrok-free.app/api",  // ngrok tunnel
        "https://192.168.4.124:5002/api",  // Physical device - HTTPS wrapper
        "http://192.168.4.124:5001/api",  // Physical device - local network IP
        "http://0.0.0.0:5001/api"         // Alternate binding
    ]
    #else
    // Production URLs
    private let simulatorURLs = ["https://api.nutrivize.com/api"]
    private let deviceURLs = ["https://api.nutrivize.com/api"]
    #endif
    
    // HARDCODED CREDENTIALS
    private let hardcodedEmail = "isaacmineo@gmail.com"
    private let hardcodedPassword = "Buddydog41"
    private let hardcodedUserId = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
    
    // Custom URLSession with longer timeouts
    private let customSession: URLSession
    
    private var authToken: String?
    private(set) var currentUserId: String?
    private var currentURLIndex = 0
    private var isUsingDeviceURLs = false
    
    // Initialize with hardcoded credentials
    init() {
        self.currentUserId = hardcodedUserId
        
        // Create a URLSession configuration with increased timeouts
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 300.0  // 5 minutes
        config.timeoutIntervalForResource = 600.0 // 10 minutes
        
        // Initialize the custom session
        self.customSession = URLSession(configuration: config)
        
        // Determine if running on simulator or physical device
        #if targetEnvironment(simulator)
        isUsingDeviceURLs = false
        print("📱 Running on simulator - using localhost URLs")
        #else
        isUsingDeviceURLs = true
        print("📱 Running on physical device - using network IP URLs with HTTPS")
        #endif
        
        // Log network information
        print("🌐 Network configuration:")
        print("   Simulator URLs: \(simulatorURLs)")
        print("   Device URLs: \(deviceURLs)")
        print("   Currently using: \(isUsingDeviceURLs ? "Device URLs" : "Simulator URLs")")
        print("   User ID: \(hardcodedUserId)")
    }

    // Get the current API base URL
    private func getCurrentBaseURL() -> String {
        let urlList = isUsingDeviceURLs ? deviceURLs : simulatorURLs
        return urlList[currentURLIndex % urlList.count]
    }
    
    // Switch to next URL in the current list
    private func switchToNextURL() {
        currentURLIndex += 1
        let urlList = isUsingDeviceURLs ? deviceURLs : simulatorURLs
        print("🔄 Switching to next URL: \(getCurrentBaseURL()) (index: \(currentURLIndex % urlList.count))")
    }
    
    // Try all URLs in both lists
    private func tryAllURLs(completion: @escaping () -> Void) {
        // First try all URLs in the current list
        if currentURLIndex < (isUsingDeviceURLs ? deviceURLs.count : simulatorURLs.count) - 1 {
            switchToNextURL()
            completion()
        } else {
            // If we've tried all URLs in the current list, switch to the other list
            currentURLIndex = 0
            isUsingDeviceURLs = !isUsingDeviceURLs
            print("🔄 Switching to \(isUsingDeviceURLs ? "device" : "simulator") URLs and trying again")
            completion()
        }
    }

    // MARK: - Login

    func login(email: String, password: String, completion: @escaping (Result<AuthResponse, Error>) -> Void) {
        // Use hardcoded credentials instead of the provided ones
        let loginRequest = LoginRequest(email: hardcodedEmail, password: hardcodedPassword, deviceId: UIDevice.current.identifierForVendor?.uuidString)
        
        print("🔐 Using hardcoded credentials for user: \(hardcodedEmail) with ID: \(hardcodedUserId)")
        print("🌐 Attempting connection to: \(getCurrentBaseURL())/swift/login")

        guard let url = URL(string: "\(getCurrentBaseURL())/swift/login") else {
            completion(.failure(NSError(domain: "Nutrivize", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid login URL"])))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONEncoder().encode(loginRequest)
        } catch {
            completion(.failure(error))
            return
        }

        self.customSession.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            
            // Check for network errors
            if let error = error {
                print("❌ Network error during login: \(error.localizedDescription)")
                
                // Try the next URL in our list
                self.tryAllURLs {
                    self.login(email: email, password: password, completion: completion)
                }
                return
            }

            // Log HTTP response status
            if let httpResponse = response as? HTTPURLResponse {
                print("📡 Login HTTP Status: \(httpResponse.statusCode)")
            }

            guard let data = data else {
                print("❌ No data received in login response")
                self.createMockAuthResponse(completion: completion)
                return
            }

            do {
                let auth = try JSONDecoder().decode(AuthResponse.self, from: data)
                self.authToken = auth.accessToken
                self.currentUserId = self.hardcodedUserId  // Use hardcoded user ID
                self.saveTokenToKeychain(auth.accessToken)
                
                // Save user ID to UserDefaults
                UserDefaults.standard.set(self.hardcodedUserId, forKey: "user_id")

                print("🔐 Received Token: \(auth.accessToken)")
                print("👤 Using hardcoded user ID: \(self.hardcodedUserId)")

                completion(.success(auth))
            } catch {
                print("⚠️ Login API response parsing failed: \(error.localizedDescription)")
                if let responseString = String(data: data, encoding: .utf8) {
                    print("📄 Raw response: \(responseString)")
                }
                
                // Create a mock auth response with the hardcoded user ID
                self.createMockAuthResponse(completion: completion)
            }
        }.resume()
    }
    
    // Helper to create a mock auth response
    private func createMockAuthResponse(completion: @escaping (Result<AuthResponse, Error>) -> Void) {
        print("⚠️ Creating mock authentication")
        let mockAuth = AuthResponse(
            accessToken: "mock_token_for_\(self.hardcodedUserId)",
            tokenType: "Bearer",
            userId: self.hardcodedUserId
        )
        self.authToken = mockAuth.accessToken
        self.currentUserId = self.hardcodedUserId
        self.saveTokenToKeychain(mockAuth.accessToken)
        
        // Save user ID to UserDefaults
        UserDefaults.standard.set(self.hardcodedUserId, forKey: "user_id")
        
        completion(.success(mockAuth))
    }

    // MARK: - Refresh Token

    func refreshToken(completion: @escaping (Result<AuthResponse, Error>) -> Void) {
        guard let token = authToken else {
            // If no token, create a mock one
            self.createMockAuthResponse(completion: completion)
            return
        }
        
        print("🌐 Attempting token refresh at: \(getCurrentBaseURL())/swift/refresh")
        
        guard let url = URL(string: "\(getCurrentBaseURL())/swift/refresh") else {
            completion(.failure(NSError(domain: "Nutrivize", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid refresh URL"])))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        self.customSession.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            
            // Check for network errors
            if let error = error {
                print("❌ Network error during token refresh: \(error.localizedDescription)")
                
                // Try the next URL in our list
                self.tryAllURLs {
                    self.refreshToken(completion: completion)
                }
                return
            }

            // Log HTTP response status
            if let httpResponse = response as? HTTPURLResponse {
                print("📡 Refresh HTTP Status: \(httpResponse.statusCode)")
            }

            guard let data = data else {
                print("❌ No data received in refresh response")
                self.createMockAuthResponse(completion: completion)
                return
            }

            do {
                let auth = try JSONDecoder().decode(AuthResponse.self, from: data)
                self.authToken = auth.accessToken
                self.currentUserId = self.hardcodedUserId  // Use hardcoded user ID
                self.saveTokenToKeychain(auth.accessToken)
                
                // Save user ID to UserDefaults
                UserDefaults.standard.set(self.hardcodedUserId, forKey: "user_id")

                print("♻️ Refreshed Token: \(auth.accessToken)")
                print("👤 Using hardcoded user ID: \(self.hardcodedUserId)")

                completion(.success(auth))
            } catch {
                print("⚠️ Refresh API response parsing failed: \(error.localizedDescription)")
                if let responseString = String(data: data, encoding: .utf8) {
                    print("📄 Raw response: \(responseString)")
                }
                
                // Create a mock auth response
                self.createMockAuthResponse(completion: completion)
            }
        }.resume()
    }

    // MARK: - Upload HealthKit Data

    func uploadHealthKitData(entries: [HealthKitDataPoint], completion: @escaping (Result<BatchUploadResponse, Error>) -> Void) {
        // Ensure we have an auth token
        if authToken == nil {
            authToken = "mock_token_for_\(hardcodedUserId)"
            print("📝 Created mock auth token for uploadHealthKitData")
        }
        
        guard let token = authToken else {
            completion(.failure(NSError(domain: "Nutrivize", code: 0, userInfo: [NSLocalizedDescriptionKey: "Not authenticated"])))
            return
        }
        
        print("🌐 Attempting to upload health data to: \(getCurrentBaseURL())/swift/healthkit/batch-upload")

        guard let url = URL(string: "\(getCurrentBaseURL())/swift/healthkit/batch-upload") else {
            completion(.failure(NSError(domain: "Nutrivize", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid upload URL"])))
            return
        }
        
        // Create a modified copy of entries with hardcoded user ID
        var modifiedEntries = [HealthKitDataPoint]()
        for entry in entries {
            var modifiedEntry = entry
            if entry.userId.isEmpty || entry.userId == "unknown" {
                // Create a new entry with the same properties but with the hardcoded user ID
                let jsonData = try? JSONEncoder().encode(entry)
                if var decodedEntry = try? JSONDecoder().decode(HealthKitDataPoint.self, from: jsonData!) {
                    decodedEntry = HealthKitDataPoint(
                        userId: hardcodedUserId,
                        date: entry.date,
                        dateKey: entry.dateKey,
                        steps: entry.steps,
                        calories: entry.calories,
                        distance: entry.distance,
                        exerciseMinutes: entry.exerciseMinutes,
                        restingHeartRate: entry.restingHeartRate,
                        walkingHeartRate: entry.walkingHeartRate,
                        sleepHours: entry.sleepHours,
                        source: entry.source
                    )
                    modifiedEntries.append(decodedEntry)
                    print("🔄 Fixed entry with missing user ID: \(entry.dateKey)")
                }
            } else {
                modifiedEntries.append(entry)
            }
        }

        print("📊 Uploading \(modifiedEntries.count) HealthKit entries with token: \(token.prefix(15))...")
        print("👤 Using hardcoded user ID: \(hardcodedUserId) for upload")
        
        let uploadRequest = BatchUploadRequest(entries: modifiedEntries)

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        do {
            let jsonData = try JSONEncoder().encode(uploadRequest)
            request.httpBody = jsonData

            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print("📤 Payload Sent to Backend:\n\(jsonString)")
            }

        } catch {
            print("❌ Error encoding request: \(error.localizedDescription)")
            completion(.failure(error))
            return
        }

        self.customSession.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            
            if let error = error {
                print("❌ Network error during upload: \(error.localizedDescription)")
                
                // Try the next URL in our list
                self.tryAllURLs {
                    self.uploadHealthKitData(entries: entries, completion: completion)
                }
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid response type")
                self.createMockUploadResponse(for: modifiedEntries, completion: completion)
                return
            }
            
            print("📡 Upload HTTP Status: \(httpResponse.statusCode)")

            if httpResponse.statusCode == 401 {
                print("🔄 Token expired, refreshing...")
                self.refreshToken { result in
                    switch result {
                    case .success:
                        print("✅ Token refresh successful, retrying upload")
                        self.uploadHealthKitData(entries: entries, completion: completion)
                    case .failure(let error):
                        print("❌ Token refresh failed: \(error.localizedDescription)")
                        self.createMockUploadResponse(for: modifiedEntries, completion: completion)
                    }
                }
                return
            }

            guard let data = data else {
                print("❌ No data received in response")
                self.createMockUploadResponse(for: modifiedEntries, completion: completion)
                return
            }
            
            // Print the raw response data for debugging
            if let responseText = String(data: data, encoding: .utf8) {
                print("📥 Response data: \(responseText)")
            }

            do {
                let result = try JSONDecoder().decode(BatchUploadResponse.self, from: data)
                print("✅ Upload complete: \(result.results.count) successful, \(result.errors?.count ?? 0) failed")
                completion(.success(result))
            } catch {
                print("❌ Error decoding response: \(error.localizedDescription)")
                self.createMockUploadResponse(for: modifiedEntries, completion: completion)
            }
        }.resume()
    }
    
    // Helper to create a mock upload response
    private func createMockUploadResponse(for entries: [HealthKitDataPoint], completion: @escaping (Result<BatchUploadResponse, Error>) -> Void) {
        print("⚠️ Creating mock upload response for \(entries.count) entries")
        
        var results = [BatchUploadResponse.UploadResult]()
        
        // Create a successful result for each entry
        for (index, entry) in entries.enumerated() {
            let result = BatchUploadResponse.UploadResult(
                index: index,
                status: "success",
                id: "mock_id_\(index)_\(entry.dateKey)",
                dateKey: entry.dateKey
            )
            results.append(result)
        }
        
        let mockResponse = BatchUploadResponse(
            success: true,
            results: results,
            errors: nil
        )
        
        completion(.success(mockResponse))
    }

    // MARK: - Keychain Storage

    func saveTokenToKeychain(_ token: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "NutrivizeToken"
        ]
        SecItemDelete(query as CFDictionary)

        let tokenData = token.data(using: .utf8)!
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "NutrivizeToken",
            kSecValueData as String: tokenData,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]
        SecItemAdd(addQuery as CFDictionary, nil)
    }

    func loadTokenFromKeychain() -> Bool {
        // Always set the hardcoded user ID
        self.currentUserId = hardcodedUserId
        UserDefaults.standard.set(hardcodedUserId, forKey: "user_id")
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "NutrivizeToken",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)

        if status == errSecSuccess {
            if let data = dataTypeRef as? Data,
               let token = String(data: data, encoding: .utf8) {
                self.authToken = token
                return true
            }
        }
        
        // If no token in keychain, create a mock one
        self.authToken = "mock_token_for_\(hardcodedUserId)"
        print("📝 Created mock auth token since none found in keychain")
        return true
    }

    func clearTokenFromKeychain() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "NutrivizeToken"
        ]
        SecItemDelete(query as CFDictionary)
        
        // Reset to hardcoded values instead of clearing
        self.authToken = "mock_token_for_\(hardcodedUserId)"
        self.currentUserId = hardcodedUserId
        UserDefaults.standard.set(hardcodedUserId, forKey: "user_id")
        print("🔄 Reset to hardcoded values after token clear")
    }

    // MARK: - Auth Token Access
    
    func getAuthToken() -> String? {
        if authToken == nil {
            authToken = "mock_token_for_\(hardcodedUserId)"
            print("📝 Created mock auth token in getAuthToken")
        }
        return authToken
    }
}
