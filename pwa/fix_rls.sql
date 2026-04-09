-- Step 1: Drop ALL policies on profiles (dynamically, catches every name)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
  END LOOP;
END $$;

-- Step 2: Recreate profiles policies WITHOUT any reference to profiles table itself
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Step 3: Drop ALL policies on robot_schedules
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies WHERE tablename = 'robot_schedules'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON robot_schedules', r.policyname);
  END LOOP;
END $$;

-- Step 4: Recreate robot_schedules policies
CREATE POLICY "schedules_select_own" ON robot_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "schedules_insert_own" ON robot_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "schedules_update_own" ON robot_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "schedules_delete_own" ON robot_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Verify - show remaining policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('profiles', 'robot_schedules')
ORDER BY tablename, policyname;
