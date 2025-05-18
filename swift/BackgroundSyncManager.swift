import BackgroundTasks
import Foundation
import HealthKit

class BackgroundSyncManager {
    static let shared = BackgroundSyncManager()
    private let taskIdentifier = "com.healthbridge.healthkit.sync"
    private let healthStore = HKHealthStore()
    private let hardcodedUserId = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
    private var isTaskRegistered = false

    // MARK: - Background Task Registration

    func registerBackgroundTask() {
        // Only register once to prevent the "already registered" exception
        if isTaskRegistered {
            print("🔄 Background task already registered, skipping registration")
            return
        }
        
        BGTaskScheduler.shared.register(forTaskWithIdentifier: taskIdentifier, using: nil) { task in
            self.handleBackgroundSync(task: task as! BGProcessingTask)
        }
        
        isTaskRegistered = true
        print("🔄 Background task registered with identifier: \(taskIdentifier)")
    }

    // MARK: - Schedule Background Sync

    func scheduleBackgroundSync() {
        let request = BGProcessingTaskRequest(identifier: taskIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60 * 60) // 1 hour from now

        do {
            try BGTaskScheduler.shared.submit(request)
            print("🕓 Background sync scheduled for 1 hour from now")
        } catch {
            print("❌ Failed to schedule background sync: \(error.localizedDescription)")
        }
    }

    // MARK: - Handle Background Task Execution

    private func handleBackgroundSync(task: BGProcessingTask) {
        print("🔄 Background sync started...")

        task.expirationHandler = {
            print("❌ Background sync expired")
            task.setTaskCompleted(success: false)
        }

        // Make sure token exists (will generate mock token if needed)
        NutrivizeAPIClient.shared.loadTokenFromKeychain()
        
        // Always use hardcoded user ID
        print("👤 Using hardcoded User ID for background sync: \(hardcodedUserId)")
        UserDefaults.standard.set(hardcodedUserId, forKey: "user_id")

        HealthDataManager.shared.setupHealthKit { success, error in
            guard success else {
                print("❌ HealthKit not authorized for background sync: \(error?.localizedDescription ?? "Unknown error")")
                task.setTaskCompleted(success: false)
                return
            }

            HealthDataManager.shared.fetchAndUploadLastTenDays(forUserId: self.hardcodedUserId) { result in
                switch result {
                case .success(let count):
                    print("✅ Background sync complete: \(count) days uploaded")
                    task.setTaskCompleted(success: true)
                case .failure(let error):
                    print("❌ Background sync failed: \(error.localizedDescription)")
                    task.setTaskCompleted(success: false)
                }

                self.scheduleBackgroundSync() // Schedule next one
            }
        }
    }

    // MARK: - Manual Trigger for Launch

    func performImmediateSyncIfNeeded() {
        // Make sure token exists (will generate mock token if needed)
        NutrivizeAPIClient.shared.loadTokenFromKeychain()
        
        // Always use hardcoded user ID
        print("👤 Using hardcoded User ID for immediate sync: \(hardcodedUserId)")
        UserDefaults.standard.set(hardcodedUserId, forKey: "user_id")

        HealthDataManager.shared.setupHealthKit { success, error in
            guard success else {
                print("❌ HealthKit not authorized for immediate sync: \(error?.localizedDescription ?? "Unknown error")")
                return
            }

            HealthDataManager.shared.fetchAndUploadLastTenDays(forUserId: self.hardcodedUserId) { result in
                switch result {
                case .success(let count):
                    print("✅ Immediate sync complete: \(count) days uploaded")
                case .failure(let error):
                    print("❌ Immediate sync failed: \(error.localizedDescription)")
                }
            }
        }
    }
}
