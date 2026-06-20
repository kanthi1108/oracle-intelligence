-- ============================================================
-- ORACLE PLATFORM SEED DATA
-- Migration: 002_seed_data.sql
-- 40 Location Records · 4 Demo Users · Credit Ledger Entries
-- ALL records are complete — zero placeholders
-- ============================================================

-- ============================================================
-- SEED: users
-- ============================================================

INSERT INTO public.users
  (id, auth_id, email, full_name, role, subscription_tier,
   subscription_status, subscription_start_at, subscription_end_at,
   reports_generated, onboarding_completed, preferred_city)
VALUES
  -- Row 1: Platform Administrator
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-aaaa-0000-0000-000000000001',
    'amehta@enterprise.com',
    'Arjun Mehta',
    'admin',
    'enterprise',
    'active',
    '2026-01-01 00:00:00+05:30',
    '2027-01-01 00:00:00+05:30',
    47,
    TRUE,
    'Hyderabad'
  ),
  -- Row 3: Free Tier User (Spark)
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-aaaa-0000-0000-000000000003',
    'rkrishna@enterprise.com',
    'Rahul Krishnaswamy',
    'member',
    'spark',
    'active',
    NULL,
    NULL,
    2,
    TRUE,
    'Pune'
  );

-- ============================================================
-- SEED: locations — Hyderabad (20 localities)
-- ============================================================

INSERT INTO public.locations
  (locality_name, city_name, state_name, population, population_growth_pct,
   median_income_inr, education_index, daily_footfall, commercial_density_pct,
   competitor_count, avg_rental_sqft_inr, metro_station_within_1km,
   highway_adjacency, parking_availability, office_parks_within_2km,
   hospitals_within_3km, schools_within_2km, data_vintage_year, confidence_tier)
VALUES
  ('Madhapur', 'Hyderabad', 'Telangana',
   142000, 11.4, 95000, 0.847,
   68000, 72.5, 14, 145.00,
   TRUE, FALSE, 'moderate', 18, 6, 12, 2025, 'high'),

  ('Gachibowli', 'Hyderabad', 'Telangana',
   118000, 9.8, 102000, 0.871,
   74000, 68.3, 11, 162.00,
   FALSE, TRUE, 'abundant', 22, 5, 9, 2025, 'high'),

  ('Kondapur', 'Hyderabad', 'Telangana',
   96000, 13.2, 88000, 0.823,
   51000, 61.4, 9, 128.00,
   FALSE, FALSE, 'moderate', 14, 4, 11, 2025, 'high'),

  ('Banjara Hills', 'Hyderabad', 'Telangana',
   78000, 3.1, 145000, 0.891,
   62000, 84.2, 19, 220.00,
   FALSE, FALSE, 'scarce', 8, 9, 7, 2025, 'high'),

  ('Jubilee Hills', 'Hyderabad', 'Telangana',
   65000, 2.4, 162000, 0.904,
   54000, 86.7, 22, 245.00,
   FALSE, FALSE, 'scarce', 6, 11, 8, 2025, 'high'),

  ('Kukatpally', 'Hyderabad', 'Telangana',
   198000, 6.7, 54000, 0.731,
   82000, 58.9, 24, 85.00,
   TRUE, TRUE, 'abundant', 4, 7, 18, 2025, 'high'),

  ('Begumpet', 'Hyderabad', 'Telangana',
   87000, 1.8, 71000, 0.768,
   45000, 65.1, 16, 110.00,
   FALSE, FALSE, 'moderate', 7, 8, 9, 2025, 'high'),

  ('Secunderabad', 'Hyderabad', 'Telangana',
   224000, 2.2, 48000, 0.714,
   91000, 62.4, 31, 78.00,
   TRUE, TRUE, 'moderate', 3, 12, 22, 2025, 'high'),

  ('Ameerpet', 'Hyderabad', 'Telangana',
   112000, 1.1, 52000, 0.744,
   77000, 71.8, 28, 92.00,
   TRUE, FALSE, 'scarce', 5, 9, 16, 2025, 'high'),

  ('LB Nagar', 'Hyderabad', 'Telangana',
   181000, 5.4, 41000, 0.672,
   58000, 47.3, 18, 68.00,
   FALSE, TRUE, 'abundant', 2, 6, 14, 2025, 'medium'),

  ('Uppal', 'Hyderabad', 'Telangana',
   163000, 7.8, 38000, 0.648,
   61000, 43.6, 15, 62.00,
   FALSE, TRUE, 'abundant', 1, 5, 13, 2025, 'medium'),

  ('Miyapur', 'Hyderabad', 'Telangana',
   138000, 10.1, 56000, 0.748,
   52000, 52.7, 12, 82.00,
   TRUE, FALSE, 'moderate', 9, 4, 11, 2025, 'high'),

  ('Nallagandla', 'Hyderabad', 'Telangana',
   72000, 16.8, 78000, 0.812,
   31000, 44.2, 6, 95.00,
   FALSE, FALSE, 'abundant', 11, 3, 8, 2025, 'medium'),

  ('Nizampet', 'Hyderabad', 'Telangana',
   94000, 14.3, 61000, 0.776,
   38000, 48.1, 8, 74.00,
   FALSE, FALSE, 'moderate', 7, 3, 10, 2025, 'medium'),

  ('Himayatnagar', 'Hyderabad', 'Telangana',
   58000, 0.9, 82000, 0.814,
   43000, 79.3, 14, 135.00,
   FALSE, FALSE, 'scarce', 4, 10, 6, 2025, 'high'),

  ('Kompally', 'Hyderabad', 'Telangana',
   121000, 18.7, 47000, 0.698,
   42000, 39.4, 7, 58.00,
   FALSE, TRUE, 'abundant', 3, 2, 9, 2025, 'medium'),

  ('Manikonda', 'Hyderabad', 'Telangana',
   109000, 12.6, 64000, 0.782,
   47000, 55.8, 10, 88.00,
   FALSE, FALSE, 'moderate', 12, 4, 8, 2025, 'medium'),

  ('Tolichowki', 'Hyderabad', 'Telangana',
   83000, 4.2, 58000, 0.742,
   48000, 61.2, 13, 96.00,
   FALSE, FALSE, 'moderate', 9, 5, 7, 2025, 'medium'),

  ('Attapur', 'Hyderabad', 'Telangana',
   71000, 6.8, 44000, 0.694,
   36000, 45.7, 9, 71.00,
   FALSE, TRUE, 'abundant', 2, 3, 8, 2025, 'medium'),

  ('Gajularamaram', 'Hyderabad', 'Telangana',
   54000, 21.4, 32000, 0.614,
   22000, 31.8, 4, 48.00,
   FALSE, FALSE, 'abundant', 1, 1, 6, 2025, 'low'),

-- ============================================================
-- SEED: locations — Bengaluru (10 localities)
-- ============================================================

  ('Koramangala', 'Bengaluru', 'Karnataka',
   164000, 7.2, 118000, 0.882,
   84000, 78.4, 21, 178.00,
   FALSE, FALSE, 'scarce', 24, 7, 11, 2025, 'high'),

  ('Indiranagar', 'Bengaluru', 'Karnataka',
   138000, 4.1, 132000, 0.894,
   79000, 81.6, 26, 192.00,
   FALSE, FALSE, 'scarce', 19, 8, 9, 2025, 'high'),

  ('Whitefield', 'Bengaluru', 'Karnataka',
   242000, 14.8, 97000, 0.858,
   91000, 66.3, 17, 135.00,
   FALSE, TRUE, 'abundant', 31, 9, 14, 2025, 'high'),

  ('Electronic City', 'Bengaluru', 'Karnataka',
   198000, 12.3, 84000, 0.843,
   74000, 58.7, 14, 112.00,
   FALSE, TRUE, 'abundant', 27, 6, 11, 2025, 'high'),

  ('Jayanagar', 'Bengaluru', 'Karnataka',
   121000, 1.8, 88000, 0.867,
   61000, 72.1, 18, 148.00,
   FALSE, FALSE, 'moderate', 7, 12, 14, 2025, 'high'),

  ('HSR Layout', 'Bengaluru', 'Karnataka',
   143000, 8.6, 104000, 0.876,
   71000, 71.4, 16, 158.00,
   FALSE, FALSE, 'moderate', 18, 6, 12, 2025, 'high'),

  ('Marathahalli', 'Bengaluru', 'Karnataka',
   187000, 11.2, 76000, 0.821,
   88000, 64.8, 22, 118.00,
   FALSE, TRUE, 'moderate', 14, 5, 16, 2025, 'high'),

  ('Rajajinagar', 'Bengaluru', 'Karnataka',
   156000, 2.4, 67000, 0.798,
   65000, 67.3, 19, 124.00,
   FALSE, FALSE, 'moderate', 6, 9, 13, 2025, 'medium'),

  ('Banashankari', 'Bengaluru', 'Karnataka',
   132000, 3.7, 59000, 0.774,
   54000, 58.4, 14, 98.00,
   FALSE, FALSE, 'moderate', 4, 8, 15, 2025, 'medium'),

  ('Yelahanka', 'Bengaluru', 'Karnataka',
   174000, 19.4, 54000, 0.741,
   61000, 47.2, 11, 84.00,
   FALSE, TRUE, 'abundant', 8, 4, 12, 2025, 'medium'),

-- ============================================================
-- SEED: locations — Pune (10 localities)
-- ============================================================

  ('Koregaon Park', 'Pune', 'Maharashtra',
   98000, 4.8, 128000, 0.891,
   72000, 82.4, 23, 198.00,
   FALSE, FALSE, 'moderate', 11, 8, 7, 2025, 'high'),

  ('Baner', 'Pune', 'Maharashtra',
   147000, 12.6, 94000, 0.848,
   68000, 68.7, 18, 142.00,
   FALSE, TRUE, 'abundant', 19, 5, 11, 2025, 'high'),

  ('Viman Nagar', 'Pune', 'Maharashtra',
   112000, 9.4, 102000, 0.862,
   64000, 71.3, 16, 162.00,
   FALSE, FALSE, 'moderate', 14, 6, 9, 2025, 'high'),

  ('Kothrud', 'Pune', 'Maharashtra',
   168000, 3.2, 72000, 0.824,
   58000, 63.8, 14, 112.00,
   FALSE, FALSE, 'moderate', 8, 7, 17, 2025, 'high'),

  ('Hadapsar', 'Pune', 'Maharashtra',
   214000, 8.7, 56000, 0.764,
   74000, 52.4, 19, 88.00,
   FALSE, TRUE, 'abundant', 12, 6, 14, 2025, 'medium'),

  ('Wakad', 'Pune', 'Maharashtra',
   128000, 15.8, 81000, 0.814,
   58000, 58.9, 13, 116.00,
   FALSE, TRUE, 'abundant', 16, 4, 10, 2025, 'medium'),

  ('Hinjewadi', 'Pune', 'Maharashtra',
   187000, 22.1, 88000, 0.832,
   82000, 61.4, 21, 124.00,
   FALSE, TRUE, 'abundant', 24, 3, 8, 2025, 'high'),

  ('Aundh', 'Pune', 'Maharashtra',
   104000, 5.6, 91000, 0.854,
   62000, 69.7, 17, 148.00,
   FALSE, FALSE, 'moderate', 9, 7, 12, 2025, 'high'),

  ('Pimple Saudagar', 'Pune', 'Maharashtra',
   142000, 17.3, 68000, 0.796,
   54000, 54.2, 12, 98.00,
   FALSE, FALSE, 'abundant', 11, 3, 11, 2025, 'medium'),

  ('Kondhwa', 'Pune', 'Maharashtra',
   118000, 9.1, 48000, 0.724,
   44000, 44.8, 8, 72.00,
   FALSE, FALSE, 'abundant', 5, 4, 10, 2025, 'medium');

-- ============================================================
-- SEED: credits — initial grant ledger entries
-- ============================================================

INSERT INTO public.credits
  (user_id, transaction_type, direction, amount, balance_after,
   description, idempotency_key)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'promotional_grant', 'credit', 9999, 9999,
    'Admin account — enterprise unlimited credit grant (initial seed)',
    'seed_admin_001_initial'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'initial_grant', 'credit', 3, 3,
    'Spark tier — 3 lifetime free credits on account creation',
    'seed_spark_003_initial'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'report_consumption', 'debit', 2, 1,
    'Batch debit — 2 reports generated',
    'seed_spark_003_debit2'
  );

-- ============================================================
-- SEED COMPLETE
-- Users: 2 (admin, spark)
-- Locations: 40 (Hyderabad 20, Bengaluru 10, Pune 10)
-- Credit Entries: 3
-- ============================================================
