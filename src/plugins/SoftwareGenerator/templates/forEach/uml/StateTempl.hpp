{{#if isState}}
/**
 * @brief Declaration for {{{fullyQualifiedName}}} : {{{path}}}
 *
 * States contain other states and can consume generic
 * StateMachine::Event objects if they have internal or external
 * transitions on those events and if those transitions' guards are
 * satisfied. Only one transition can consume an event in a given
 * state machine.
 *
 * There is also a different kind of Event, the tick event, which is
 * not consumed, but instead executes from the top-level state all
 * the way to the curently active leaf state.
 *
 * Entry and Exit actions also occur whenever a state is entered or
 * exited, respectively.
 */
class {{{sanitizedName}}} : public StateMachine::StateBase {
public:

  {{#each Substates}}
  {{> StateTemplHpp }}
  {{/each}}
  
  {{{sanitizedName}}} ( ) : _parentState( nullptr ), _activeState( nullptr ) {}
  {{{sanitizedName}}} ( StateBase* _parent ) : _parentState( _parent ), _activeState( nullptr ) {}
    
  /**
   * @brief Runs the entry() function defined in the model and then
   *  calls the active child's entry() as _activeState->entry().
   */
  void                     entry ( void );

  /**
   * @brief Runs the exit() function defined in the model and then
   *  calls the parent's _parentState->exit() if the parent's active
   *  child state has changed. If the parent's active child state
   *  has not changed, upwards tree traversal stops.
   *
   * @return StateMachine::StateBase* pointer to new root on which
   *                                  to call entry
   */
  StateMachine::StateBase* exit ( void );

  /**
   * @brief Runs the tick() function defined in the model and then
   *  calls _activeState->tick().
   */
  void                     tick ( void );

  /**
   * @brief Calls _activeState->handleEvent( event ), then if the
   *  event is not nullptr (meaning the event was not consumed by
   *  the child subtree), it checks the event against all internal
   *  transitions associated with that Event.  If the event is still
   *  not a nullptr (meaning the event was not consumed by the
   *  internal transitions), then it checks the event against all
   *  external transitions associated with that Event.
   *
   * @param[in] StateMachine::Event* Event needing to be handled
   *
   * @return true if event is consumed, false otherwise
   */
  bool                     handleEvent ( StateMachine::Event* event );

  /**
   * @brief Will be known from the model so will be generated in
   *  derived classes to immediately return the correct initial
   *  state pointer for quickly transitioning to the proper state
   *  during external transition handling.
   *
   * @return StateBase*  Pointer to initial substate
   */
  StateMachine::StateBase* getInitial ( void );
};
{{/if}}
