import Foundation
import HealthKit

class HealthDataManager {
    static let shared = HealthDataManager()
    private let healthStore = HKHealthStore()
    private var userId: String = "GME7nGpJQRc2v9T057vJ4oyqAJN2" // Hardcoded user ID

    // Set user ID method
    func setUserId(_ newUserId: String) {
        // Always use hardcoded user ID regardless of what's passed in
        userId = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
        print("HealthDataManager: Always using hardcoded User ID: \(userId) (ignoring passed value: \(newUserId))")
    }

    // Get the current user ID
    func getUserId() -> String {
        return userId
    }

    // MARK: - HealthKit Setup

    func setupHealthKit(completion: @escaping (Bool, Error?) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(false, NSError(domain: "HealthKit", code: 0, userInfo: [NSLocalizedDescriptionKey: "HealthKit not available"]))
            return
        }

        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKObjectType.quantityType(forIdentifier: .appleExerciseTime)!,
            HKObjectType.quantityType(forIdentifier: .restingHeartRate)!,
            HKObjectType.quantityType(forIdentifier: .walkingHeartRateAverage)!,
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        ]

        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            completion(success, error)
        }
    }

    // MARK: - Fetch and Upload

    func fetchAndUploadLastTenDays(forUserId userId: String? = nil, completion: @escaping (Result<Int, Error>) -> Void) {
        // Always use hardcoded user ID regardless of parameters
        print("ℹ️ Using hardcoded User ID: \(self.userId) (ignoring parameter: \(userId ?? "nil"))")
        
        print("🔄 Starting health data fetch for hardcoded user ID: \(self.userId)")
        
        fetchLastTenDays { entries in
            print("📊 Fetched \(entries.count) health data entries for upload")
            NutrivizeAPIClient.shared.uploadHealthKitData(entries: entries) { result in
                switch result {
                case .success(let response):
                    completion(.success(response.results.count))
                case .failure(let error):
                    completion(.failure(error))
                }
            }
        }
    }

    // MARK: - Raw Fetch

    func fetchLastTenDays(completion: @escaping ([HealthKitDataPoint]) -> Void) {
        // We know userId is never empty now since it's hardcoded
        
        let calendar = Calendar.current
        let endDate = Date()
        let startDate = calendar.date(byAdding: .day, value: -9, to: endDate)!

        var results: [HealthKitDataPoint] = []
        let group = DispatchGroup()

        for offset in 0..<10 {
            guard let day = calendar.date(byAdding: .day, value: offset, to: startDate) else { continue }

            group.enter()
            fetchDailyData(for: day) { result in
                if case .success(let point) = result {
                    results.append(point)
                }
                group.leave()
            }
        }

        group.notify(queue: .main) {
            completion(results)
        }
    }

    // MARK: - Fetch Single Day

    private func fetchDailyData(for date: Date, completion: @escaping (Result<HealthKitDataPoint, Error>) -> Void) {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else {
            return completion(.failure(NSError(domain: "Date", code: 0)))
        }

        let group = DispatchGroup()
        var steps = 0.0, calories = 0.0, distance = 0.0, exerciseMinutes = 0.0
        var restingHR = 0.0, walkingHR = 0.0, sleepHours = 0.0
        var capturedError: Error?

        // Quantity fetches
        let quantityFetches: [(HKQuantityTypeIdentifier, HKUnit, (Double) -> Void)] = [
            (.stepCount, .count(), { steps = $0 }),
            (.activeEnergyBurned, .kilocalorie(), { calories = $0 }),
            (.distanceWalkingRunning, .meter(), { distance = $0 }),
            (.appleExerciseTime, .minute(), { exerciseMinutes = $0 })
        ]

        for (type, unit, setter) in quantityFetches {
            group.enter()
            fetchQuantitySum(type: type, unit: unit, start: startOfDay, end: endOfDay) { result in
                switch result {
                case .success(let value):
                    setter(value)
                case .failure(let error):
                    capturedError = error
                }
                group.leave()
            }
        }

        // Latest value fetches
        let latestFetches: [(HKQuantityTypeIdentifier, HKUnit, (Double) -> Void)] = [
            (.restingHeartRate, .count().unitDivided(by: .minute()), { restingHR = $0 }),
            (.walkingHeartRateAverage, .count().unitDivided(by: .minute()), { walkingHR = $0 })
        ]

        for (type, unit, setter) in latestFetches {
            group.enter()
            fetchLatestQuantity(type: type, unit: unit, start: startOfDay, end: endOfDay) { result in
                switch result {
                case .success(let value):
                    setter(value)
                case .failure(let error):
                    capturedError = error
                }
                group.leave()
            }
        }

        // Sleep
        group.enter()
        fetchSleepHours(start: startOfDay, end: endOfDay) { result in
            switch result {
            case .success(let value):
                sleepHours = value
            case .failure(let error):
                capturedError = error
            }
            group.leave()
        }

        // Final completion
        group.notify(queue: .main) {
            if let error = capturedError {
                completion(.failure(error))
                return
            }

            let formatter = ISO8601DateFormatter()
            let dateStr = formatter.string(from: startOfDay)
            let dateKey = String(dateStr.prefix(10))

            let dataPoint = HealthKitDataPoint(
                userId: self.userId,
                date: dateStr,
                dateKey: dateKey,
                steps: steps,
                calories: calories,
                distance: distance,
                exerciseMinutes: exerciseMinutes,
                restingHeartRate: restingHR,
                walkingHeartRate: walkingHR,
                sleepHours: sleepHours,
                source: "Apple HealthKit (iOS)"
            )

            completion(.success(dataPoint))
        }
    }

    // MARK: - Helper Queries

    private func fetchQuantitySum(type: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date, completion: @escaping (Result<Double, Error>) -> Void) {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: type) else {
            completion(.success(0))
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: quantityType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            if let error = error {
                completion(.failure(error))
            } else {
                let value = result?.sumQuantity()?.doubleValue(for: unit) ?? 0
                completion(.success(value))
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestQuantity(type: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date, completion: @escaping (Result<Double, Error>) -> Void) {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: type) else {
            completion(.success(0))
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let query = HKSampleQuery(sampleType: quantityType, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, error in
            if let error = error {
                completion(.failure(error))
            } else if let sample = samples?.first as? HKQuantitySample {
                completion(.success(sample.quantity.doubleValue(for: unit)))
            } else {
                completion(.success(0))
            }
        }

        healthStore.execute(query)
    }

    private func fetchSleepHours(start: Date, end: Date, completion: @escaping (Result<Double, Error>) -> Void) {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            completion(.success(0))
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let results = samples as? [HKCategorySample] else {
                completion(.success(0))
                return
            }

            let total = results
                .filter { $0.value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue }
                .reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }

            completion(.success(total / 3600))
        }

        healthStore.execute(query)
    }
}
