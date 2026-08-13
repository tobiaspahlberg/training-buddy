#!/bin/sh
# Every suite, in order. Run it from anywhere:
#
#     cd tests && npm install     # once
#     npm test                    # or: sh tests/run.sh
#
# A crash counts as a failure, and is spotted by how node exits and by a
# stack trace at the start of a line - not by hunting for words in the
# output, which once matched an assertion's own wording.
cd "$(dirname "$0")" || exit 1

SUITES="smoke hist clock del wods rehab plan5k delplan delhist colour size undo
        speech voices sheet kinds latevoice search note update lead backup editor"
SUITES=$(echo $SUITES)          # onto one line, so the check below can match

total=0; bad=0
for f in $SUITES; do
  out=$(node "$f.js" 2>&1); code=$?
  n=$(printf '%s\n' "$out" | grep -c "^  ok")
  fail=$(printf '%s\n' "$out" | grep -cE "^FAIL")
  trace=$(printf '%s\n' "$out" | grep -cE "^[A-Za-z]*Error:|^    at ")
  crash=0
  [ "$code" -ne 0 ] && crash=1
  [ "$trace" -gt 0 ] && crash=1
  total=$((total+n)); bad=$((bad+fail+crash))
  printf "%-9s %3d ok" "$f" "$n"
  [ "$fail" -gt 0 ] && printf "  %d FAILED" "$fail"
  [ "$crash" -eq 1 ] && printf "  CRASHED (exit %d)" "$code"
  printf "\n"
done

# A suite nobody runs is a suite nobody trusts: say so if one is lying about.
for f in *.js; do
  name=${f%.js}
  [ "$name" = "shot" ] && continue
  case " $SUITES " in
    *" $name "*) ;;
    *) printf "\n!! %s is not in the list at the top of run.sh, so it never runs\n" "$f" ;;
  esac
done

printf "\n%d assertions, %d problems\n" "$total" "$bad"
[ "$bad" -eq 0 ] || exit 1
